// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as React from "react";
import { connect } from "react-redux";
import * as SearchIcon from "readium-desktop/renderer/assets/icons/baseline-search-24px-grey.svg";
import * as styles from "readium-desktop/renderer/assets/styles/header.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { RootState } from "readium-desktop/renderer/redux/states";
import { dispatchHistoryPush } from "readium-desktop/renderer/routing";
import { TFormEvent } from "readium-desktop/typings/react";
import { TDispatch } from "readium-desktop/typings/redux";

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps,
    ReturnType<typeof mapStateToProps>,
    ReturnType<typeof mapDispatchToProps> {
}

class Search extends React.Component<IProps, undefined> {

    private inputRef: React.RefObject<HTMLInputElement>;

    constructor(props: IProps) {
        super(props);

        this.inputRef = React.createRef<HTMLInputElement>();
        this.search = this.search.bind(this);
    }

    public render(): React.ReactElement<{}> {
        const { __ } = this.props;
        return (
            <form onSubmit={this.search} role="search">
                <input
                    ref={this.inputRef}
                    type="search"
                    id="menu_search"
                    aria-label={__("accessibility.searchBook")}
                    placeholder={__("header.searchPlaceholder")}
                />
                <button id={styles.search_img}>
                    <SVG svg={SearchIcon} title={__("header.searchTitle")} />
                </button>
            </form>
        );
    }

    public search(e: TFormEvent) {
        e.preventDefault();

        const value = this.inputRef?.current?.value;

        const { historyPush } = this.props;

        if (!value) {
            historyPush({
                ...this.props.location,
                pathname: "/library/search/all",
            });
        } else {
            const target = "/library/search/text/" + value; // + this.props.location.search;
            historyPush({
                ...this.props.location,
                pathname: target,
            });
        }
    }
}

const mapStateToProps = (state: RootState) => ({
    location: state.router.location,
});

const mapDispatchToProps = (dispatch: TDispatch) => ({
    historyPush: dispatchHistoryPush(dispatch),
});

export default connect(mapStateToProps, mapDispatchToProps)(withTranslator(Search));
