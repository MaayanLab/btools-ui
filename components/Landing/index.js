import React from 'react'
import { Redirect } from 'react-router-dom'

import { animateScroll as scroll } from 'react-scroll'

import Grid from '@material-ui/core/Grid'
import Typography from '@material-ui/core/Typography'
import { withStyles } from '@material-ui/core/styles'

import { landingStyle } from '../../styles/jss/theme.js'


import { SearchCard, StatDiv, CountsDiv, BottomLinks, WordCloud } from './Misc'
import { ChartCard, Selections } from '../Admin/dashboard.js'
import { BarChart } from '../Admin/BarChart.js'

export default withStyles(landingStyle)(class LandingPage extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      input: {},
      searchType: 'metadata',
      type: 'Overlap',
      scroll: false,
    }
    this.searchChange = this.searchChange.bind(this)
    this.scrollToTop = this.scrollToTop.bind(this)
  }

  componentDidMount() {
    this.props.resetCurrentSearch()
  }

  scrollToTop() {
    scroll.scrollToTop()
  }

  searchChange(e) {
    this.props.searchChange(e.target.value)
  }


  render() {
    if (this.props.metadata_search.completed_search === 3 && this.props.metadata_search.currentSearch !== '') {
      return <Redirect to={{ pathname: '/MetadataSearch', search: `?q=${encodeURIComponent(this.props.metadata_search.currentSearch)}` }} />
    }
    return (
      <div>
        <Grid container
          spacing={24}
          alignItems={'center'}
          direction={'column'}>
          <Grid item xs={12} className={this.props.classes.stretched}>
            <SearchCard
              search={this.props.metadata_search.search}
              searchChange={this.searchChange}
              currentSearchChange={this.props.currentSearchChange}
              handleChange={this.props.handleChange}
              type={this.state.type}
              searchType={this.props.searchType}
              submit={this.props.submit}
              changeSignatureType={this.props.changeSignatureType}
              updateSignatureInput={this.props.updateSignatureInput}
              ui_values={this.props.ui_values}
              classes={this.props.classes}
              signature_search={this.props.signature_search}
            />
          </Grid>
          { this.props.table_counts.length === 0 ? null :
            <Grid item xs={12} className={this.props.classes.stretched}>
              <StatDiv {...this.props}/>
            </Grid>
          }
          <Grid item xs={12} className={this.props.classes.stretched}>
            <Grid container
              spacing={24}
              alignItems={'center'}>
              { this.props.resource_signatures === undefined ? null :
                <Grid item xs={12} sm>
                  <ChartCard cardheight={300} pie_stats={this.props.resource_signatures} resources color={'Blue'} ui_values={this.props.ui_values}/>
                  <div className={this.props.classes.centered}>
                    <Typography variant="caption">
                      {this.props.ui_values.LandingText.resource_pie_caption || 'Signatures per Resource'}
                    </Typography>
                  </div>
                </Grid>
              }
              { Object.keys(this.props.barcounts).length === 0 || this.props.barcounts === undefined ? null :
                <Grid item xs={12} sm>
                  { this.props.ui_values.bar_chart !== undefined ? (
                    <div className={this.props.classes.centered}>
                      {this.props.barcounts[this.props.ui_values.bar_chart.Field_Name] !== undefined ? (
                      <BarChart meta_counts={this.props.barcounts[this.props.ui_values.bar_chart.Field_Name]}
                        ui_values={this.props.ui_values}/>) : (
                      null
                      )}
                      <Typography variant="caption">
                        {this.props.ui_values.bar_chart.Caption}
                      </Typography>
                    </div>
                  ) : (
                    <div className={this.props.classes.centered}>
                      {this.props.barcounts[Object.keys(this.props.barcounts)[0]] !== undefined ?
                      <BarChart meta_counts={this.props.barcounts[Object.keys(this.props.barcounts)[0]]} 
                        ui_values={this.props.ui_values}/> :
                        null
                      }
                      <Typography variant="caption">
                        Bar Chart
                      </Typography>
                    </div>
                  )}
                </Grid>
              }
            </Grid>
          </Grid>
          <Grid item xs={12} className={this.props.classes.stretched}>
          </Grid>
          { Object.keys(this.props.meta_counts).length === 0 ? null :
            <Grid item xs={12} className={this.props.classes.stretched}>
              <CountsDiv {...this.props}/>
            </Grid>
          }
          { Object.keys(this.props.pie_fields_and_stats).length === 0 ? null :
            <Grid item xs={12} className={this.props.classes.stretched}>
              <Grid container
                spacing={24}
                alignItems={'center'}>
                <Grid item xs={12}>
                  <div className={this.props.classes.centered}>
                    <span className={this.props.classes.vertical20}>{this.props.ui_values.LandingText.text_3 || 'Examine metadata:'}</span>
                    <Selections
                      value={this.props.selected_field}
                      values={Object.keys(this.props.pie_fields_and_stats).sort()}
                      onChange={(e) => this.props.handleSelectField(e)}
                    />
                  </div>
                </Grid>
                <Grid item xs={12} sm>
                  <div className={this.props.classes.centered}>
                    <ChartCard cardheight={300} pie_stats={this.props.pie_stats} color={'Blue'} ui_values={this.props.ui_values}/>
                    <Typography variant="caption">
                      {`${this.props.pie_table} per ${this.props.pie_preferred_name}`}
                    </Typography>
                  </div>
                </Grid>
                { this.props.ui_values.deactivate_wordcloud ? null :
                  <Grid item xs={12} sm>
                    <div className={this.props.classes.centered}>
                      <WordCloud classes={this.props.classes} stats={this.props.pie_stats}/>
                      <Typography variant="caption">
                        Top {this.props.pie_preferred_name} terms
                      </Typography>
                    </div>
                  </Grid>
                }
              </Grid>
            </Grid>
          }
          <Grid item xs={12}>
            <BottomLinks handleChange={this.props.handleChange}
              {...this.props} />
          </Grid>
          <Grid item xs={12}>
          </Grid>
        </Grid>
      </div>
    )
  }
})
