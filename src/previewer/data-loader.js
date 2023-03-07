import React from 'react'
import PropTypes from 'prop-types'
import readFile from 'icosa/utils/read-file'
import style from './style.module.scss'

class FileInput extends React.Component {
  // TODO: create icosa.react.file-input and replace this one

  onChange (e) {
    if (this.props.onChange) {
      this.props.onChange(e.currentTarget.files)
    }
  }

  render () {
    return (
      <input
       {...this.props} type="file"
       onChange={this.onChange.bind(this)} />
    )
  }
}

export default class PrevalenceDataLoader extends React.Component {
  static propTypes = {
    onChange: PropTypes.func.isRequired,
    onWTChange: PropTypes.func.isRequired
  }

  async onChange (files) {
    if (files.length === 0) {
      this.props.onChange(null)
    } else {
      const jsonstring = await readFile(files[0])
      let data = JSON.parse(jsonstring)
      data = data.map(row => ({
        gene: row.gene,
        subtype: row.subtype,
        rxType: row.rx_type,
        position: row.position,
        aminoAcid: row.aa,
        total: row.total,
        count: row.count,
        percent: row.percent * 100
      }))
      this.props.onChange(data)
    }
  }

  async onWTChange (files) {
    if (files.length === 0) {
      this.props.onWTChange(null)
    } else {
      let seq = await readFile(files[0])
      seq = seq.replace(/^>.*$/, seq)
      this.props.onWTChange(seq.trim())
    }
  }

  render () {
    return <div className={style['prevalence-data-loader']}>
      <label htmlFor="prevalence-data-loader">Prevalence data file: </label>
      <FileInput
       onChange={this.onChange.bind(this)}
       name="prevalence-data-loader" accept="*.json,application/json" />
      <label htmlFor="wildtype-consensus">Wild type AA consensus: </label>
      <FileInput
       onChange={this.onWTChange.bind(this)}
       name="wildtype-consensus" accept="*.txt,*.fasta,*.fas" />
    </div>
  }
}
