import React from 'react';
import { Component, PropTypes } from '../utils/';
import Thead from './Thead';
import Tbody from './Tbody';
import Colgroup from './Colgroup';
import Paging from '../paging/';
import Loading from '../loading/';
import Icon from '../icon/';

export default class Table extends Component {
  static childContextTypes = {
    component: PropTypes.any,
  }
  constructor(props) {
    super(props);
    this.state = {
      // data: props.data,          //当前所有数据
      // rowsCount: 0,              //选中的行数
      // rowsChecked: {},           //选中的数据
      // rowsDisabled: {},          //禁用的数据
      // headIndeterminate: false,  //表头半选中状态
      // headchecked: false,        //表头选中状态
      // rowCheckedDisable:{},      //选中并禁用的
      ...this.initalState(props),
      ischecked: !!props.rowSelection, // 是否存在选择功能

      trHoverClassName: [],       // 行移入移除事件，
      scrollLeft: 0,
      scrollRight: 0,
      scrollTop: 0,
      leftFixedWidth: 0,   // 左边固定的宽度
      rightFixedWidth: 0,  // 右边固定的宽度
      leftFixedTop: null      // 左边固定的距离顶部距离
    }
  }
  getChildContext() {
    return { component: this };
  }
  // 初始化数据
  initalState(props) {
    let { data, columns } = props
    let rowsCount = 0, rowsChecked = {}, rowsDisabled = {}, rowCheckedDisable = {};
    for (let i = 0; i < data.length; i++) {
      if (data[i]._checked && data[i]._disabled) {
        rowCheckedDisable[i] = data[i]
      }
      if (data[i]._checked) {
        delete data[i]._checked;
        rowsCount += 1;
        rowsChecked[i] = data[i]
      }
      if (data[i]._disabled) {
        delete data[i]._disabled;
        rowsDisabled[i] = data[i]
      }
      // 值为false的也清除
      delete data[i]._checked;
      delete data[i]._disabled;
    }
    if (!!props.rowSelection) {
      columns.unshift({ title: "_select", key: "_select", fixed: 'left' })
    }
    return {
      data: data,
      rowsCount,
      rowsChecked,
      rowsDisabled,
      rowCheckedDisable,
      columns,
      headIndeterminate: rowsCount > 0 && rowsCount < data.length,
      headchecked: rowsCount === data.length,
    }
  }
  componentDidMount() {
    // leftFixedTop
    if (this.refs.tableThead && this.refs.tableThead.refs.thead
      && this.refs.tableThead.refs.thead.offsetHeight > 0) {
      this.setState({
        leftFixedTop: this.refs.tableThead.refs.thead.offsetHeight
      })
    }
  }
  // 单行选择事件
  onRowSelection = (row, index, checked, e) => {
    const { rowsChecked, rowsCount } = this.state;
    const { data, rowSelection } = this.props;
    let _rowsChecked = rowsChecked
    let count = Math.abs(checked ? rowsCount + 1 : rowsCount - 1);
    if (checked) {
      _rowsChecked[index] = row
    } else {
      delete _rowsChecked[index]
    }
    this.setState({
      rowsChecked: _rowsChecked,
      rowsCount: count,
      headchecked: count === data.length,
      headIndeterminate: count > 0 && count < data.length
    })
    rowSelection.onSelect && rowSelection.onSelect(row, index, checked, rowsChecked, e)
  }
  // 全选
  selectedAll = (e, checked) => {
    const { rowSelection } = this.props;
    const { data, rowsDisabled, rowCheckedDisable } = this.state;
    let _rowsChecked = {}, count = 0
    data.map((item, idx) => {
      if (checked && !rowCheckedDisable[idx] && !rowsDisabled[idx]) {
        _rowsChecked[idx] = item;
        ++count;
      } else {
        if (rowCheckedDisable[idx]) {
          _rowsChecked[idx] = item;
        }
      }
      return item
    })
    this.setState({
      rowsChecked: _rowsChecked,
      rowsCount: count,
    }, () => {
      rowSelection.onSelectAll && rowSelection.onSelectAll(_rowsChecked, checked, e);
    })
  }
  //横向滚动事件
  onScroll(e) {
    const { headerWrapper, bodyWrapper, fixedBodyWrapper, leftBodyWrapper, rightBodyWrapper } = this.refs;
    const { prefixCls } = this.props;
    const target = e && e.target ? e.target : bodyWrapper.target;

    if (target instanceof HTMLDivElement) {

      if (e.target === leftBodyWrapper) {
        bodyWrapper && (bodyWrapper.scrollTop = target.scrollTop);
        rightBodyWrapper && (rightBodyWrapper.scrollTop = target.scrollTop);
      }
      if (e.target === rightBodyWrapper) {
        bodyWrapper && (bodyWrapper.scrollTop = target.scrollTop);
        leftBodyWrapper && (leftBodyWrapper.scrollTop = target.scrollTop);
      }
      if (e.target === bodyWrapper) {
        headerWrapper.scrollLeft = target.scrollLeft;

        leftBodyWrapper && (leftBodyWrapper.scrollTop = target.scrollTop);
        rightBodyWrapper && (rightBodyWrapper.scrollTop = target.scrollTop);
      }
    }

    if (!fixedBodyWrapper) return;
    let scrollRight = target.scrollWidth - (target.scrollLeft + target.clientWidth)
    let fixedClassNames = "";
    if (target.scrollLeft < 1) {
      fixedClassNames = `${prefixCls}-fixed ${prefixCls}-scroll-position-left`;
    }
    if (target.scrollLeft > 0 && scrollRight > 0) {
      fixedClassNames = `${prefixCls}-fixed ${prefixCls}-scroll-position-middle`;
    }
    if (scrollRight < 1) {
      fixedClassNames = `${prefixCls}-fixed ${prefixCls}-scroll-position-right`;
    }
    if (e && e.target === bodyWrapper) {
      fixedBodyWrapper.className = fixedClassNames;
    }

  }
  setFixedWidth = (leftWidth, rightWidth) => {
    this.setState({
      leftFixedWidth: leftWidth,
      rightFixedWidth: rightWidth,
    })
  }
  onTrHover = (ty, idx) => {
    this.setState({
      trHoverClassName: ty === 'enter' ? [idx] : []
    })
  }
  // 是否有固定列
  isColumnsFixed(columns, type) {
    let isFixed = false;
    for (let i = 0; i < columns.length; i++) {
      if (columns[i].fixed === type) {
        isFixed = true;
        break;
      }
      if (columns[i].children && columns[i].children.length) {
        isFixed = this.isColumnsFixed(columns[i].children, type)
        if (isFixed === true) break;
      }
    }
    return isFixed;
  }
  render() {
    const { prefixCls, className, rowSelection, caption, footer, data, width, paging, loading } = this.props;
    const { headchecked, trHoverClassName, columns } = this.state
    let { height } = this.props;
    let tableTbody = (refname) => (<Tbody
      ref={refname}
      type={refname}
      rowSelection={rowSelection}
      trHoverClassName={trHoverClassName}
      onTrHover={this.onTrHover}
      onRowSelection={this.onRowSelection}
      columns={columns} data={data} />
    )

    let tableThead = (refname) => (<Thead
      ref={refname}
      rowSelection={rowSelection}
      setFixedWidth={this.setFixedWidth}
      headchecked={headchecked}
      selectedAll={this.selectedAll}
      columns={columns} />
    )

    let tableColgroup = (<Colgroup columns={columns} />);
    let tableCaption = caption && (<div ref="caption" className={`${prefixCls}-caption`}>{caption}</div>);
    let tableFooter = footer && (<div className={`${prefixCls}-footer`}>{footer}</div>)

    let pagingView = paging && <Paging className={`${prefixCls}-paging`} {...paging} />;
    if (height || width || rowSelection || loading === (true || false)) {
      let fixedCloneTable = (width) ? (
        <div ref="fixedBodyWrapper" className={this.classNames(`${prefixCls}-fixed`, `${prefixCls}-scroll-position-left`)}
          style={{ marginTop: -this.state.leftFixedTop }}
        >
          {this.isColumnsFixed(columns, 'left') &&
            <div className={this.classNames(`${prefixCls}-fixed-left`)}
              style={{ width: this.state.leftFixedWidth }}>
              <div className={`${prefixCls}-fixed-head-left`}>
                <table>
                  {React.cloneElement(tableColgroup)}
                  {React.cloneElement(tableThead(), {
                    cloneElement: "left",
                  })}
                </table>
              </div>
              <div ref="leftBodyWrapper" onScroll={this.onScroll.bind(this)} style={{ height }} className={`${prefixCls}-fixed-body-left`}>
                <table>
                  {React.cloneElement(tableColgroup, { cloneElement: "left" })}
                  {React.cloneElement(tableTbody('tbody_left'), { cloneElement: "left" })}
                </table>
              </div>
            </div>
          }
          {this.isColumnsFixed(columns, 'right') &&
            <div className={this.classNames(`${prefixCls}-fixed-right`)}
              style={{ width: this.state.rightFixedWidth }}>
              <div className={`${prefixCls}-fixed-head-right`}>
                <table>
                  {React.cloneElement(tableColgroup)}
                  {React.cloneElement(tableThead(), {
                    cloneElement: "right",
                  })}
                </table>
              </div>
              <div ref="rightBodyWrapper" style={{ height }} className={`${prefixCls}-fixed-body-right`}>
                <table>
                  {React.cloneElement(tableColgroup, { cloneElement: "right" })}
                  {React.cloneElement(tableTbody('tbody_right'), { cloneElement: "right" })}
                </table>
              </div>
            </div>
          }
        </div>
      ) : null;

      // 固定头 或者左右滚动
      return (
        <div className={`${prefixCls}-warpper`}>
          <div className={this.classNames(className, prefixCls, `${prefixCls}-scroll`, {
            [`is-empty`]: data.length === 0,
            [`is-footer`]: tableFooter,
          })}>
            {tableCaption}
            <div ref="headerWrapper" className={`${prefixCls}-head`}>
              <table style={{ width }}>
                {tableColgroup}
                {tableThead("tableThead")}
              </table>
            </div>
            <Loading loading={this.props.loading === undefined ? false : loading}>
              {data.length === 0 ?
                <div className="placeholder"><Icon type="frown-o" /> 暂无数据</div> :
                <div ref="bodyWrapper" onScroll={this.onScroll.bind(this)} style={{ height }} className={`${prefixCls}-body`}>
                  <table style={{ width }}>
                    {tableColgroup}
                    {tableTbody('tbody')}
                  </table>
                </div>
              }
              {tableFooter}
              {fixedCloneTable}
              {pagingView}
            </Loading>
          </div>
        </div>
      )
    }

    return (
      <div className={`${prefixCls}-warpper`}>
        <div className={this.classNames(className, prefixCls, `${prefixCls}-default`, {
          [`is-empty`]: data.length === 0,
          [`is-footer`]: tableFooter,
        })}>
          {tableCaption}
          <table>
            {tableColgroup}
            {tableThead("tableThead")}
            {data.length === 0 ? (
              <tbody>
                <tr>
                  <td ref={(elm) => {
                    if (elm) { elm.colSpan = this.refs.tableThead.getColSpan(columns); }
                  }}><Icon type="frown-o" /> 暂无数据</td>
                </tr>
              </tbody>
            ) : tableTbody()}
          </table>
          {tableFooter}
        </div>
        {pagingView}
      </div>
    )
  }
}

Table.defaultProps = {
  prefixCls: 'w-table',
  size: 'default',
  // loading: false,
  data: [],
  columns: []
};

Table.propTypes = {
  columns: PropTypes.array,
  prefixCls: PropTypes.string,
  dataIndex: PropTypes.string,
  size: PropTypes.oneOf(['large', 'default', 'small']),
  data: PropTypes.array,
  height: PropTypes.number,
  rowSelection: PropTypes.shape({
    onSelect: PropTypes.func,
    onSelectAll: PropTypes.func,
    onCellClick: PropTypes.func
  }),
  paging: PropTypes.object,
  // onSelectAll: PropTypes.func,
  // onSelect: PropTypes.func,
  scroll: PropTypes.object,
}