import React from 'react'
import { Redirect } from 'react-router-dom'
import { call } from '../../util/call'
import Button from '@material-ui/core/Button';
import { connect } from 'react-redux'
import { withStyles } from '@material-ui/core/styles'
import Switch from '@material-ui/core/Switch';

const style = {
  chiplabel: {
    'maxWidth': 100,
    'overflow': 'hidden',
    'fontSize': 10,
    'textOverflow': 'ellipsis',
    '&:hover': {
      overflow: 'visible',
    },
  },
  card: {
    overflow: 'auto',
    maxHeight: 200,
    marginBottom: 10,
  },
}

const mapStateToProps = (state) => {
  return {
    loading: state.loading_signature,
    ui_values: state.serverSideProps.ui_values,
  }
}

const Geneset = (props) => (
  <div className="row">
    <div className="col s12 center">
      <div className="switch">
        <label style={{ color: '#FFF',
          fontWeight: 'bold' }}>
            Gene Set or Full Signature
          <Switch
            checked={false}
            onChange={() => {
                props.toggleInput('Rank')
              }
            }
            value="sigsearch"
            color="primary"
          />
            Up and Down Gene Sets
        </label>
      </div>
    </div>
    <div className="col s12">
      <div className="input-field">
        <textarea
          id="geneset"
          placeholder={props.ui_values.LandingText.geneset_placeholder || 'Genes that are regulated in signature or overlap with gene set.'}
          style={{
            height: 200,
            overflow: 'auto',
            background: '#f7f7f7',
          }}
          value={props.input.geneset}
          onChange={(e) => {
            const input = {
              ...props.input,
              geneset: e.target.value,
            }
            props.updateInput(input)
          }}
        ></textarea>
      </div>
    </div>
  </div>
)

const UpDownGeneset = (props) => (
  <div className="row">
    <div className="col s12 center">
      <div className="switch">
        <label style={{ color: '#FFF',
          fontWeight: 'bold' }}>
            Gene Set or Full Signature
          <Switch
            checked={true}
            onChange={() => {
              props.toggleInput('Overlap')
            }}
            value="sigsearch"
            color="primary"
          />
            Up and Down Gene Sets
        </label>
      </div>
    </div>
    <div className="col s6">
      <div className="input-field">
        <textarea
          id="up_geneset"
          placeholder={props.ui_values.LandingText.up_genes_placeholder || 'Genes that are up-regulated in signature or overlap with gene set.'}
          style={{
            height: 200,
            overflow: 'auto',
            background: '#f7f7f7',
          }}
          value={props.input.up_geneset}
          onChange={(e) => {
            const input = {
              ...props.input,
              up_geneset: e.target.value,
            }
            props.updateInput(input)
          }}
        ></textarea>
      </div>
    </div>
    <div className="col s6">
      <div className="input-field">
        <textarea
          id="down_geneset"
          placeholder={props.ui_values.LandingText.down_genes_placeholder || 'Genes that are down-regulated in signature or overlap with gene set.'}
          style={{
            height: 200,
            overflow: 'auto',
            background: '#f7f7f7',
          }}
          value={props.input.down_geneset}
          onChange={(e) => {
            const input = {
              ...props.input,
              down_geneset: e.target.value,
            }
            props.updateInput(input)
          }}
        ></textarea>
      </div>
    </div>
  </div>
)

const SearchBox = (props) => {
  if (props.input.type === 'Overlap') {
    return (<Geneset {...props}/>)
  } else if (props.input.type === 'Rank') {
    return (<UpDownGeneset {...props}/>)
  } else {
    return <Redirect to="/not-found" />
  }
}

class GenesetSearchBox extends React.Component {
  // componentDidMount = () => {
  //   if (this.props.location.state!==undefined &&
  //     this.props.location.state.input!==undefined) {
  //     this.props.updateInput(this.props.location.state.input)
  //   }else {
  //     this.toggleInput(this.props.match.params.type)
  //   }
  // }

  // componentDidUpdate = (prevProps, prevState) => {
  //   const old_type = prevProps.match.params.type
  //   const current_type = this.props.match.params.type
  //   const old_state = prevProps.location.state
  //   const current_state = this.props.location.state
  //   if (current_state!==undefined && current_state.input!==undefined){
  //     console.log(current_state)
  //     console.log(old_state)
  //     if (old_state === undefined || old_state.input === undefined){
  //       this.props.updateInput(current_state.input)
  //     }else if (old_state.input.type!==current_state.input.type){
  //       this.props.updateInput(current_state.input)
  //     }else if (current_state.input.type === "Overlap" &&
  //       current_state.input.geneset !== old_state.input.geneset){
  //       console.log("here")
  //       this.props.updateInput(current_state.input)
  //     }else if (current_state.input.type === "Rank" &&
  //       (current_state.input.up_geneset !== old_state.input.up_geneset ||
  //        current_state.input.down_geneset !== old_state.input.down_geneset)){
  //       this.props.updateInput(current_state.input)
  //     }
  //   }else if (old_type !== current_type){
  //     if (this.props.location.state!==undefined &&
  //       this.props.location.state.input!==undefined) {
  //       this.props.updateInput(this.props.location.state.input)
  //     }else {
  //       this.toggleInput(this.props.match.params.type)
  //     }
  //   }
  // }


  isEmpty = () => {
    if (this.props.input === undefined) return true
    if (this.props.input.type === 'Overlap') {
      if (this.props.input.geneset === undefined) return true
      if (this.props.input.geneset === '') return true
    } else if (this.props.input.type === 'Rank') {
      if (this.props.input.up_geneset === '') return true
      if (this.props.input.up_geneset === undefined) return true
      if (this.props.input.down_geneset === '') return true
      if (this.props.input.down_geneset === undefined) return true
    }
    return false
  }


  render() {
    return (
      <div className="row">
        <SearchBox {...this.props} />
        <div className="col s12 center">
          <Button
            variant="contained"
            disabled={this.isEmpty() || this.props.loading} 
            type="submit"
            name="action"
            color="primary"
            onClick={call(this.props.submit, this.props.input)}
          >
            { this.props.loading ?
                <React.Fragment>
                  Searching &nbsp;
                  <i className="mdi mdi-spin mdi-loading" />
                </React.Fragment> :
                <React.Fragment>
                  Search
                  <i className="material-icons right">send</i>
                </React.Fragment>
            }

          </Button>
          <br /><br />
        </div>
      </div>
    )
  }
}

export default connect(mapStateToProps)(withStyles(style)(GenesetSearchBox))
