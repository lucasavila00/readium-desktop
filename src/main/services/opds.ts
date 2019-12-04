// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as debug_ from "debug";
import { injectable } from "inversify";
import { httpGet, IHttpGetResult } from "readium-desktop/common/utils/http";
import { IOpdsLinkView, IOpdsResultView } from "readium-desktop/common/views/opds";
import { OpdsParsingError } from "readium-desktop/main/exceptions/opds";
import * as xmldom from "xmldom";

import { TaJsonDeserialize } from "@r2-lcp-js/serializable";
import { convertOpds1ToOpds2, convertOpds1ToOpds2_EntryToPublication } from "@r2-opds-js/opds/converter";
import { OPDS } from "@r2-opds-js/opds/opds1/opds";
import { OPDSFeed } from "@r2-opds-js/opds/opds2/opds2";
import { XML } from "@r2-utils-js/_utils/xml-js-mapper";
import { Entry } from "r2-opds-js/dist/es6-es2015/src/opds/opds1/opds-entry";

import * as URITemplate from "urijs/src/URITemplate";

// Logger
const debug = debug_("readium-desktop:main#services/catalog");

const SEARCH_TERM = "{searchTerms}";

const findLink = (ln: IOpdsLinkView[], type: string) => ln && ln.find((link) =>
    link.type?.includes(type));

@injectable()
export class OpdsService {

    private static contentTypeisXml(contentType?: string) {
        return contentType
            && (contentType.startsWith("application/atom+xml")
                || contentType.startsWith("application/xml")
                || contentType.startsWith("text/xml"));
    }

    private static contentTypeisOpds(contentType?: string) {
        return contentType
            && (contentType.startsWith("application/json")
                || contentType.startsWith("application/opds+json"));
    }

    private static async getOpenSearchUrl(opensearchLink: IOpdsLinkView): Promise<string | undefined> {
        const searchResult = await httpGet(opensearchLink.url, {}, (searchData) => {
            if (searchData.isFailure) {
                searchData.data = undefined;
            }
            searchData.data = searchData.body;
            return searchData;
        });
        return searchResult.data;
    }

    public async opdsRequest<T extends IOpdsResultView>(
        url: string,
        converter: (r2OpdsFeed: OPDSFeed) => T)
        : Promise<IHttpGetResult<string, T>> {
        return httpGet(url, {
            timeout: 10000,
        }, (opdsFeedData) => {

            let r2OpdsFeed: OPDSFeed;

            if (opdsFeedData.isFailure) {
                return opdsFeedData;
            }

            const contentType = opdsFeedData.contentType;

            if (OpdsService.contentTypeisXml(contentType)) {
                const xmlDom = new xmldom.DOMParser().parseFromString(opdsFeedData.body);

                if (!xmlDom || !xmlDom.documentElement) {
                    throw new OpdsParsingError(`Unable to parse ${url}`);
                }

                const isEntry = xmlDom.documentElement.localName === "entry";
                if (isEntry) {
                    // It's a single publication entry and not an OpdsFeed

                    const opds1Entry = XML.deserialize<Entry>(xmlDom, Entry);
                    const r2OpdsPublication = convertOpds1ToOpds2_EntryToPublication(opds1Entry);

                    // create a simple OpdsFeed to pass to converter function
                    r2OpdsFeed = {
                        Metadata: {
                            Title: r2OpdsPublication.Metadata.Title,
                        },
                        Publications: [r2OpdsPublication],
                    } as OPDSFeed;

                } else {

                    const opds1Feed = XML.deserialize<OPDS>(xmlDom, OPDS);
                    r2OpdsFeed = convertOpds1ToOpds2(opds1Feed);
                }

            } else if (OpdsService.contentTypeisOpds(contentType)) {

                // FIXME : Desarialize OPDSFeed Or OpdsPublication
                r2OpdsFeed = TaJsonDeserialize<OPDSFeed>(
                    JSON.parse(opdsFeedData.body),
                    OPDSFeed,
                );
            } else {

                debug(`unknown url content-type : ${opdsFeedData.url} - ${contentType}`);
                throw new Error(
                    `Not a valid OPDS HTTP Content-Type for ${opdsFeedData.url} (${contentType})`,
                );
            }

            // apply to converter
            opdsFeedData.data = converter(r2OpdsFeed);

            return opdsFeedData;
        });
    }

    public async parseOpdsSearchUrl(link: IOpdsLinkView[]): Promise<string | undefined> {

        debug("opds search links receive", link);

        // find search type before parsing url
        const atomLink = findLink(link, "application/atom+xml");
        const opensearchLink = !atomLink && findLink(link, "application/opensearchdescription+xml");
        const opdsLink = !opensearchLink && findLink(link, "application/opds+json");

        try {
            // http://examples.net/opds/search.php?q={searchTerms}
            if (atomLink?.url) {
                const url = new URL(atomLink.url);
                if (url.search.includes(SEARCH_TERM) || url.pathname.includes(SEARCH_TERM)) {
                    return (atomLink.url);
                }

                // http://static.wolnelektury.pl/opensearch.xml
            } else if (opensearchLink?.url) {
                return (await OpdsService.getOpenSearchUrl(opensearchLink));

                // https://catalog.feedbooks.com/search.json{?query}
            } else if (opdsLink?.url) {

                const uriTemplate = new URITemplate(opdsLink.url);
                const uriExpanded = uriTemplate.expand({ query: "\{searchTerms\}" });
                const url = uriExpanded.toString().replace("%7B", "{").replace("%7D", "}");

                return url;
            }
        } catch {
            // ignore
        }
        return (undefined);
    }
}