import React from 'react'
import { fetch_meta } from './util/fetch_meta'
import { send_meta_post, send_meta_patch, delete_meta } from './util/send_meta'
import { get_card_data } from './util/get_card_data'
import Grid from '@material-ui/core/Grid'
import Tabs from '@material-ui/core/Tabs'
import Tab from '@material-ui/core/Tab'
import CircularProgress from '@material-ui/core/CircularProgress';
import IconButton from '@material-ui/core/IconButton';
import TablePagination from '@material-ui/core/TablePagination'
import { DataTable, ExpandedMeta, ExpandButton } from '@maayanlab/data-table'
import { ExpandedForm } from "./ExpandedForm"
import deepEqual from "deep-equal"
import Alert from '@material-ui/lab/Alert';
import Snackbar from '@material-ui/core/Snackbar';
import { Typography } from '@material-ui/core';

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
            expandedForm: null,
            page: 0,
            perPage: 10,
            alert: null,
        }
    }

    search = async (model, limit=10, skip=0) => {
        const { response, contentRange } = await fetch_meta({
            endpoint: `/${model}`,
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
          expanded: this.state.expanded === id ? null: id,
          expandedForm: null,
        })
      }
    
    handleEditClick = (id) => {
        this.setState({
          expandedForm: this.state.expandedForm === id ? null: id,
          expanded: null,
        })
      }

    updateCollection = (model, search_results) => {
        if (search_results[this.state.model].count == 0){
            model = this.state.tabs.filter(m=>search_results[m].count>0)[0] || this.state.model
        }
        const coll = search_results[model].response
        const collection = this.process_card_data(coll)
        return {model, collection}
    }
    
    componentDidMount = async () => {
        const search_results = {}
        for (const model in this.props.preferred_names){
            search_results[model] = await this.search(model)
        }
        let model = this.state.model 
        const updates = this.updateCollection(model, search_results)
        this.setState({
            search_results,
            ...updates
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
            page: 0,
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

    delete_entry = async (id) => {
        const {response} = await delete_meta({
            endpoint: `/${this.state.model}/${id}`,
        })
        if (response.error){
            this.setState({
                alert: {
                    severity: "error",
                    message: response.error.error,
                }
            })
            console.error(response.error)
        }else {
            const {search_results, model} = this.state
            const {start, end} = search_results[model]
            const perPage = end-start
            search_results[model] = await this.search(model, perPage, 0)
            const updates = this.updateCollection(model, search_results)
            this.setState({
                search_results,
                ...updates,
                alert: {
                    severity: "success",
                    message: "Deleted!",
                },
            })
        }
    }

    approve_edit = async (id) => {
        const {response} = await send_meta_post({
            endpoint: `/approve/${this.state.model}/${id}`,
          })
        if (response.error){
            this.setState({
                alert: {
                    severity: "error",
                    message: response.error.error,
                }
            })
            console.error(response.error)
        }else {
            const {search_results, model} = this.state
            const {start, end} = search_results[model]
            const perPage = end-start
            search_results[model] = await this.search(model, perPage, 0)
            const updates = this.updateCollection(model, search_results)
            this.setState({
                search_results,
                ...updates,
                alert: {
                    severity: "success",
                    message: "Approved!",
                },
            })
        }
    }
    
    send_edits = async (originalData, meta, props) => {
        if (deepEqual(meta, originalData.meta)) {
            this.setState({
                alert: {
                    severity: "info",
                    message: "Unchanged",
                },
                expandedForm: null
            })
        } else {
            const body = {
                ...originalData,
                meta
            }
            const {response} = await send_meta_patch({
                endpoint: `/${this.state.model}/${body.id}`,
                body,
              })
            if (response.error){
                this.setState({
                    alert: {
                        severity: "error",
                        message: response.error.error,
                    }
                })
                console.error(response.error)
            }else {
                const {search_results, model} = this.state
                const {start, end} = search_results[model]
                const perPage = end-start
                search_results[model] = await this.search(model, perPage, start)
                const coll = this.state.search_results[model].response
                const collection = this.process_card_data(coll)
                this.setState({
                    expandedForm: null,
                    search_results,
                    collection,
                    alert: {
                        severity: "success",
                        message: "Edited!",
                    },
                })
            }
        }
    }

    handleCloseAlert = () => {
        this.setState({
            alert: null
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
                  }
                },
                {
                    component: (props) => (
                        <ExpandedForm data={data} {...props}/>
                    ),
                    props: {
                        expanded: this.state.expandedForm == data.id,
                        uiSchema: {
                            abstract: {
                                "ui:widget": "textarea",
                            }
                        },
                        onSubmit: ({formData, ...rest}, e) => this.send_edits(data, formData, rest),
                    }
                },
              ])
              const RightComponents = (data) => ([
                {
                    component: (props) => (
                        <IconButton
                            onClick={()=>this.handleEditClick(data.id)}
                        >
                            <span class="mdi mdi-square-edit-outline"></span>
                        </IconButton>
                    ),
                    props: {
                        data: data
                    }
                },
                {
                    component: (props) => (
                        <IconButton
                            onClick={()=>this.delete_entry(data.id)}
                        ><span class="mdi mdi-delete"></span></IconButton>
                    ),
                    props: {
                        data: data
                    }
                },
                {
                    component: (props) => (
                        <IconButton
                            onClick={()=>this.approve_edit(data.id)}
                        ><span class="mdi mdi-check"></span></IconButton>
                    ),
                    props: {
                        data: data
                    }
                }, 
              ])
              const entries = this.state.collection.map(entry=>(
                {
                  ...entry,
                  key: entry.data.id,
                  LeftComponents: LeftComponents(entry.data),
                  BottomComponents: BottomComponents(entry.data),
                  RightComponents: RightComponents(entry.data)
                }
              ))
          
              return <DataTable entries={entries}/>
        }
    }

    render = () => {
        if (this.state.search_results == null){
            return <CircularProgress/>
        }
        if (this.state.collection.length===0){
            return (
                <Grid
                    container
                    direction="row"
                    justify="center"
                    alignItems="center"
                >
                    <Grid item xs style={{textAlign: "center", paddingTop: 100}}>
                        <Typography>You have no tools pending for approval</Typography>
                    </Grid>
                </Grid>
            )
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
                    <Grid item xs={12}>
                        <Snackbar open={this.state.alert!==null}
                            autoHideDuration={3000}
                            onClose={this.handleCloseAlert}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'left',
                                }}
                        >
                            <Alert onClose={this.handleCloseAlert} severity={(this.state.alert||{}).severity}>
                                {(this.state.alert||{}).message}
                            </Alert>
                        </Snackbar>
                    </Grid>
            </Grid>
        )
    }
}
