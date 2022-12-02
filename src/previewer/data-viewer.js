import React, { useDebugValue } from 'react'
import PropTypes from 'prop-types'

import style from './style.module.scss'
import {get_domain_mark, get_lena_pos_mark} from './viz';

function attachProps (prevalenceData, wildType) {
  return prevalenceData.map(({position, aminoAcid, ...props}) => ({
    position,
    aminoAcid,
    ...props,
    isWildType: wildType[position - 1] === aminoAcid
  }))
}

function prevalenceDataFilter (
  prevalenceData, requiredGene, requiredSubtype, requiredRxType, minimalPercent) {
  return prevalenceData.filter(({gene, subtype, rxType, percent, aminoAcid}) => (
    requiredGene === gene &&
    requiredSubtype === subtype &&
    requiredRxType === rxType &&
    percent >= minimalPercent &&
    ['X', '*'].indexOf(aminoAcid) === -1))
}

function groupPrevalenceDataByPosition (prevalenceData) {
  const result = Object.entries(
    prevalenceData.reduce((acc, prev) => {
      const {position} = prev
      acc[position] = acc[position] || []
      acc[position].push(prev)
      return acc
    }, {})
  )
  return result
    .sort(([a], [b]) => a - b)
    .map(([pos, prevalence]) => [
      pos,
      prevalence.sort((a, b) => b.percent - a.percent)
    ])
}

function makeChunks (array, chunkSize) {
  const result = []
  while (array.length > 0) {
    result.push(array.splice(0, chunkSize))
  }
  return result
}

function smartRound (number) {
  if (number > 1) {
    return Math.round(number)
  } else {
    return Math.round(number * 10) / 10
  }
}

function makeIndelsMap (
  prevalenceData, requiredGene, requiredSubtype, requiredRxType, minimalPercent) {
  return prevalenceData
    .filter(({gene, subtype, rxType, percent, aminoAcid}) => (
      requiredGene === gene &&
      requiredSubtype === subtype &&
      requiredRxType === rxType &&
      percent > minimalPercent &&
      ['_', '-'].indexOf(aminoAcid) > -1))
    .reduce((acc, {position}) => {
      acc[position] = true
      return acc
    }, {})
}

export default class PrevalenceViewer extends React.Component {
  static propTypes = {
    prevalenceData: PropTypes.arrayOf(
      PropTypes.shape({
        gene: PropTypes.string,
        subtype: PropTypes.string,
        position: PropTypes.number.isRequired,
        aminoAcid: PropTypes.string.isRequired,
        percent: PropTypes.number.isRequired
      })
    ),
    sitesPerRow: PropTypes.number.isRequired,
    wildType: PropTypes.string,
    gene: PropTypes.string,
    subtype: PropTypes.string
  }

  static defaultProps = {
    sitesPerRow: 50,
    struct_domain: [
      [1, 13, 'β hairpin'],
      [17, 30, 'α1'],
      [36, 43, 'α2'],
      [49, 57, 'α3'],
      [63, 83, 'α4'],
      [82, 93, 'loop'],
      [101, 104, 'α5'],
      [111, 119, 'α6'],
      [126, 145, 'α7'],
      // [150, 152, '3-10 helix'],
      [161, 173, 'α8'],
      [179, 192, 'α9'],
      [196, 205, 'α10'],
      [211, 217, 'α11'],
    ],
    func_domain: [

      [85, 93, 'CypA'],
      [146, 150, 'interdomain linker region'],
      [153, 172, 'major homology region'],
    ],
    lena_pos: {
      'resist': [
        56, 66, 67, 70, 74, 105, 107
      ],
      'pocket': [
        50, 53, 54, 57, 63, 69,
        73, 106, 130, 37,
        38, 41, 135, 169, 172, 173, 179, 182
      ]
    }
  }

  render () {
    const {prevalenceData, wildType, sitesPerRow, gene, subtype, struct_domain, func_domain, lena_pos} = this.props
    const minimalPercent = 0.1
    const indelsMap = makeIndelsMap(prevalenceData, gene, subtype, 'all', minimalPercent)
    const chunks = makeChunks(
      groupPrevalenceDataByPosition(
        attachProps(
          prevalenceDataFilter(prevalenceData, gene, subtype, 'all', minimalPercent),
          wildType || ''
        )
      ), sitesPerRow)

    return <div className={style['prevalence-viewer']} data-cells-per-row={sitesPerRow}>
      {chunks.map((chunk, idx) => [
        <div className={style['prevalence-viewer_struct']} key={`func-${idx}`}>
        {
          get_domain_mark(chunk, sitesPerRow, func_domain, 'prevalence-viewer_func_domain')
        }
        </div>,
        <div className={style['prevalence-viewer_struct']} key={`struct-${idx}`}>
          {
            get_domain_mark(chunk, sitesPerRow, struct_domain, 'prevalence-viewer_struct_domain')
          }
        </div>,
        <div className={style['prevalence-viewer_struct']} key={`lena-${idx}`}>
        {
          get_lena_pos_mark(chunk, sitesPerRow, lena_pos)
        }
      </div>,
        <div className={style['prevalence-viewer_bar']} key={`bar-${idx}`}>
          {chunk.map(([position]) => (
            <div key={position} className={style['prevalence-viewer_cell']}>
              <div
               data-visible={position % 10 === 0 || position % sitesPerRow === 1}
               className={style['prevalence-viewer_plabel']}>
                {position}
              </div>
            </div>
          ))}
        </div>,
        <div className={style['prevalence-viewer_row']} key={`row-${idx}`}>
          {chunk.map(([position, prevalence]) => (
            <div
             key={position}
             title={`Total: ${prevalence[0].total}`}
             className={style['prevalence-viewer_cell']}>
              {prevalence.map(({aminoAcid, percent, isWildType}, idx) => (
                <div
                 key={idx}
                 className={style['prevalence-viewer_value']}
                 data-is-wild-type={isWildType}
                 data-pcnt-lg={
                   percent >= 90 ? 90
                      : percent >= 10 ? 10
                        : percent >= 1 ? 1
                          : percent >= 0.1 ? 0.1 : 0
                 }>
                  {aminoAcid}
                  <sup className={style['percent']}>{smartRound(percent)}</sup>
                </div>
              ))}
              {/*indelsMap[position] ? (
                <div key={idx} className={style['prevalence-viewer_value']}>
                  •
                </div>
              ) : null*/}
            </div>
          ))}
        </div>
      ])}
    </div>
  }
}
