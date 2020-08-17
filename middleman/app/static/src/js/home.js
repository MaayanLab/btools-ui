import React from 'react'
import { fetch_meta_post } from './util/fetch_meta'
import { get_card_data } from './util/get_card_data'
import Grid from '@material-ui/core/Grid'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import CircularProgress from '@material-ui/core/CircularProgress';
import SwipeableViews from 'react-swipeable-views'
import TablePagination from '@material-ui/core/TablePagination'
import { DataTable, ExpandedMeta, ExpandButton } from '@maayanlab/data-table'

export default class Home extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            search_results: null,
            collection: null,
            tabs: Object.keys(this.props.preferred_names),
            model: Object.keys(this.props.preferred_names)[0],
            index_value: 0,
            expanded: null,
            page: 0,
            perPage: 10,
        }
    }

    search = async (model, limit=10, skip=0) => {
        const { response, contentRange } = await fetch_meta_post({
            endpoint: `/${model}/find`,
            body: {
              filter: {
                limit,
                skip
              },
            },
          })
        return {
            response,
            ...contentRange
        }
    }

    process_card_data = (coll) => {
        const collection = coll.map((data) => {
            const { original, processed, sort_tags: tags } = get_card_data(data, this.props.schemas)
            return { data: original, info: processed }
          })
        return collection
    }

    handleClick = (id) => {
        this.setState({
          expanded: this.state.expanded === id ? null: id
        })
      }

    componentDidMount = async () => {
        const search_results = {}
        for (const model in this.props.preferred_names){
            search_results[model] = await this.search(model)
        }
        const coll = search_results[this.state.model].response
        const collection = this.process_card_data(coll)
        this.setState({
            collection,
            search_results,
        })
    }
    
    handleChange = (event, index_value) => {
        const model = Object.keys(this.props.preferred_names)[index_value]
        const coll = this.state.search_results[model].response
        const collection = this.process_card_data(coll)
        this.setState({
            index_value,
            model,
            collection,
        })
    }

    handleChangeRowsPerPage = async (e) => {
        const {search_results, model} = this.state
        const {start} = search_results[this.state.model]
        const perPage = e.target.value
        search_results[model] = await this.search(model, perPage, start)
        const coll = this.state.search_results[model].response
        const collection = this.process_card_data(coll)
        this.setState({
            search_results,
            collection,
            perPage: perPage
        })
    }

    handleChangePage = async (event, page) => {
        const {search_results, model} = this.state
        const {start, end} = search_results[this.state.model]
        const perPage = end-start
        const skip = page*perPage
        search_results[model] = await this.search(model, perPage, skip)
        const coll = this.state.search_results[model].response
        const collection = this.process_card_data(coll)
        this.setState({
            search_results,
            collection,
            page
        })
    }
    
    render_table = () => {
        if (this.state.collection == null){
            return <CircularProgress/>
        }else{
            const LeftComponents = (data) => ([ {
                component: (props) => (<ExpandButton {...props}/>),
                props: {
                  expanded: this.state.expanded,
                  ButtonProps: {
                    onClick: () => this.handleClick(data.id),
                    style:{ minWidth: 5,
                            marginTop: 70,
                            paddingBottom: 0 }
                  }
                }
              }
              ])
              const BottomComponents = (data) => ([
                {
                  component: (props) => (
                    <ExpandedMeta data={data} {...props}/>
                  ),
                  props: {
                    expanded: this.state.expanded == data.id,
                    search: ["stat3"]
                  }
                },
              ])
              const entries = this.state.collection.map(entry=>(
                {
                  ...entry,
                  key: entry.data.id,
                  LeftComponents: LeftComponents(entry.data),
                  BottomComponents: BottomComponents(entry.data),
                }
              ))
          
              return <DataTable entries={entries}/>
        }
    }

    render = () => {
        if (this.state.search_results == null){
            return <CircularProgress/>
        }
        return (
            <Grid
                container
                direction="row"
                justify="center"
                alignItems="center"
            >
                <Grid item xs={2}/>
                <Grid item xs={8}>
                    <Tabs
                        value={this.state.index_value}
                        onChange={this.handleChange}
                        indicatorColor="secondary"
                        textColor="secondary"
                        centered
                        >
                        {this.state.tabs.map((model) => {
                            let count_text = ''
                            let count
                            if (model !== undefined) {
                            count = this.state.search_results[model].count || 0
                            count_text = ` (${count})` 
                            }
                            if (count === 0) return null
                            return (
                            <Tab
                                key={model}
                                label={`${this.props.preferred_names[model]}${count_text}`}
                            />
                            )
                        })}
                        </Tabs>  
                        {this.render_table()}
                    </Grid>
                    <Grid item xs={2}/>
                    <Grid item xs={2}/>
                    <Grid item xs={8}>
                        <Grid
                            container
                            direction="row"
                            justify="flex-end"
                            alignItems="center"
                        >
                            <Grid item xs={12}>
                                <TablePagination
                                    page={this.state.page}
                                    rowsPerPage={this.state.perPage}
                                    count={ this.state.search_results[this.state.model].count}
                                    onChangePage={(event, page) => this.handleChangePage(event, page)}
                                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                                    component="div"
                                />
                            </Grid>
                        </Grid>
                    </Grid>
                    <Grid item xs={2}/>
            </Grid>
        )
    }
}