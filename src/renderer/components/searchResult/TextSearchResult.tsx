// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { matchPath } from "react-router-dom";
import { PublicationView } from "readium-desktop/common/views/publication";
import { apiAction } from "readium-desktop/renderer/apiAction";
import { apiSubscribe } from "readium-desktop/renderer/apiSubscribe";
import BreadCrumb from "readium-desktop/renderer/components/layout/BreadCrumb";
import LibraryLayout from "readium-desktop/renderer/components/layout/LibraryLayout";
import { GridView } from "readium-desktop/renderer/components/utils/GridView";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import { ListView } from "readium-desktop/renderer/components/utils/ListView";
import { RootState } from "readium-desktop/renderer/redux/states";
import { DisplayType, ILibrarySearchText, routes } from "readium-desktop/renderer/routing";
import { Unsubscribe } from "redux";

import Header from "../catalog/Header";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

interface IState {
    publicationViews: PublicationView[] | undefined;
}

export class TextSearchResult extends React.Component<IProps, IState> {
    private unsubscribe: Unsubscribe;

    constructor(props: IProps) {
        super(props);

        this.state = {
            publicationViews: undefined,
        };
    }

    public componentDidMount() {
        this.unsubscribe = apiSubscribe([
            "publication/import",
            "publication/delete",
            "catalog/addEntry",
            "publication/updateTags",
        ], this.searchPublications);
    }

    public componentDidUpdate(prevProps: IProps) {
        const text = matchPath<ILibrarySearchText>(
            this.props.location.pathname, routes["/library/search/text"],
        ).params.value;
        const prevText = matchPath<ILibrarySearchText>(
            prevProps.location.pathname, routes["/library/search/text"],
        ).params.value;

        if (text !== prevText) {
            // Refresh searched pubs
            this.searchPublications();
        }
    }

    public componentWillUnmount() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    public render(): React.ReactElement<{}> {
        const displayType = this.props.location?.state?.displayType || DisplayType.Grid;
        const { __ } = this.props;
        const title = matchPath<ILibrarySearchText>(
            this.props.location.pathname, routes["/library/search/text"],
        ).params.value;

        const secondaryHeader = <Header/>;

        return (
            <LibraryLayout secondaryHeader={secondaryHeader}>
                <div>
                    <BreadCrumb
                        breadcrumb={[{ name: __("catalog.myBooks"), path: "/library" }, { name: title as string }]}
                    />
                    {this.state.publicationViews ?
                        (displayType === DisplayType.Grid ?
                            <GridView normalOrOpdsPublicationViews={this.state.publicationViews} /> :
                            <ListView normalOrOpdsPublicationViews={this.state.publicationViews} />)
                        : <></>}
                </div>
            </LibraryLayout>
        );
    }

    private searchPublications = (text?: string) => {
        if (!text) {
            text = matchPath<ILibrarySearchText>(
                this.props.location.pathname, routes["/library/search/text"],
            ).params.value;
        }
        apiAction("publication/search", text)
            .then((publicationViews) => this.setState({ publicationViews }))
            .catch((error) => console.error("Error to fetch api publication/search", error));
    }
}

const mapStateToProps = (state: RootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(TextSearchResult));
