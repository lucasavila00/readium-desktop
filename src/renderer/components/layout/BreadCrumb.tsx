// ==LICENSE-BEGIN==
// Copyright 2017 European Digital Reading Lab. All rights reserved.
// Licensed to the Readium Foundation under one or more contributor license agreements.
// Use of this source code is governed by a BSD-style license
// that can be found in the LICENSE file exposed on Github (readium) in the project repository.
// ==LICENSE-END==

import * as classNames from "classnames";
import * as React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";
import * as ArrowIcon from "readium-desktop/renderer/assets/icons/arrow-left.svg";
import * as styles from "readium-desktop/renderer/assets/styles/breadcrumb.css";
import {
    TranslatorProps, withTranslator,
} from "readium-desktop/renderer/components/utils/hoc/translator";
import SVG from "readium-desktop/renderer/components/utils/SVG";
import { RootState } from "readium-desktop/renderer/redux/states";

export interface IBreadCrumbItem {
    name: string;
    path?: string;
}

// tslint:disable-next-line: no-empty-interface
interface IBaseProps extends TranslatorProps {
    breadcrumb: IBreadCrumbItem[];
    className?: string;
}
// IProps may typically extend:
// RouteComponentProps
// ReturnType<typeof mapStateToProps>
// ReturnType<typeof mapDispatchToProps>
// tslint:disable-next-line: no-empty-interface
interface IProps extends IBaseProps, ReturnType<typeof mapStateToProps> {
}

class BreadCrumb extends React.Component<IProps, undefined> {

    constructor(props: IProps) {
        super(props);
    }

    public render(): React.ReactElement<{}> {
        const { breadcrumb, __ } = this.props;

        return (
            <div className={classNames(styles.breadcrumb, this.props.className)}>
                {
                    breadcrumb.length >= 2
                    && <Link
                        to={{
                            ...this.props.location,
                            pathname: breadcrumb[breadcrumb.length - 2].path,
                        }}
                        title={__("opds.back")}
                    >
                        <SVG svg={ArrowIcon} />
                    </Link>
                }
                {
                    breadcrumb
                    && breadcrumb.map(
                        (item, index) =>
                            item.path && index !== breadcrumb.length - 1
                                ? <Link
                                    key={index}
                                    to={{
                                        ...this.props.location,
                                        pathname: item.path,
                                    }}
                                    title={item.name}
                                >
                                    {`${item.name} /`}
                                </Link>
                                : <span key={index}>
                                    {item.name}
                                </span>,
                    )
                }
            </div>
        );
    }
}

const mapStateToProps = (state: RootState) => ({
    location: state.router.location,
});

export default connect(mapStateToProps)(withTranslator(BreadCrumb));
