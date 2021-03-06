// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as GridIcon from "readium-desktop/renderer/assets/icons/grid.svg";
import * as ListIcon from "readium-desktop/renderer/assets/icons/list.svg";
import * as styles from "readium-desktop/renderer/assets/styles/myBooks.css";
import SecondaryHeader from "readium-desktop/renderer/components/SecondaryHeader";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { RootState } from "readium-desktop/renderer/redux/states";
import { DisplayType } from "readium-desktop/renderer/routing";

import PublicationAddButton from "./PublicationAddButton";
import SearchForm from "./SearchForm";

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

class Header extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { __, location } = this.props;
        const displayType = location?.state?.displayType || DisplayType.Grid;

        return (
            <SecondaryHeader id={styles.catalog_header}>
                <Link
                    to={{
                        ...this.props.location,
                        state: {
                            displayType: DisplayType.Grid,
                        },
                    }}
                    replace={true}
                    style={(displayType !== DisplayType.Grid) ? {fill: "grey"} : {}}
                    title={__("header.gridTitle")}
                >
                    <SVG svg={GridIcon} ariaHidden/>
                </Link>
                <Link
                    to={{
                        ...this.props.location,
                        state: {
                            displayType: DisplayType.List,
                        },
                    }}
                    replace={true}
                    style={displayType !== DisplayType.List ? {fill: "grey"} : {}}
                    title={__("header.listTitle")}
                >
                    <SVG svg={ListIcon} ariaHidden/>
                </Link>
                <SearchForm />
                {this.AllBooksButton(window.location.hash)}
                <PublicationAddButton />
            </SecondaryHeader>
        );
    }

    private AllBooksButton(hash: string) {
        const search = hash.indexOf("search");
        if (search === -1) {
            return (
                <Link
                    id={styles.all_link_button}
                    to={{
                        ...this.props.location,
                        pathname: "/library/search/all",
                    }}
                >
                    {this.props.__("header.allBooks")}
                </Link>
            );
        }
        return (<></>);
    }
}

const mapStateToProps = (state: RootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(Header));
