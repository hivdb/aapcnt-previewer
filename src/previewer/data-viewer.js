import React from 'react'
import PropTypes from 'prop-types'

import style from './style.module.scss'

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
    sitesPerRow: 50
  }

  render () {
    const {prevalenceData, wildType, sitesPerRow, gene, subtype} = this.props
    const minimalPercent = 0.1
    const indelsMap = makeIndelsMap(prevalenceData, gene, subtype, 'all', minimalPercent)
    const chunks = makeChunks(
      groupPrevalenceDataByPosition(
        attachProps(
          prevalenceDataFilter(prevalenceData, gene, subtype, 'all', minimalPercent),
          wildType || ''
        )
      ), sitesPerRow)
    const domain = [
      [85, 93, 'CypA'],
      [146, 150, 'IDR'],
      [153, 172, 'MHR']
    ]

    return <div className={style['prevalence-viewer']} data-cells-per-row={sitesPerRow}>
      {chunks.map((chunk, idx) => [
        <div className={style['prevalence-viewer_struct']} key={`struct-${idx}`}>
          {
            (() => {
              let pos_list = chunk.map(([pos]) => {
                return parseInt(pos);
              })
              let start = Math.min(...pos_list);
              let stop = Math.max(...pos_list);

              let sel_domain = domain.filter(([s1, s2, n]) => {
                for (let pos of pos_list) {
                  if ((pos >= s1) && (pos <= s2)) {
                    return true;
                  }
                }
                return false;
              })

              // console.log(sel_domain);
              if (sel_domain.length === 0) {
                return <></>;
              }

              var divs = [];
              sel_domain.map(([s1, s2, n], idx) => {
                let b = s1;
                let e = s2;
                if (s1 < start) {
                  b = start;
                }
                if (s2 > stop) {
                  e = stop;
                }
                if (divs.length === 0) {
                  let blank_start_pcnt = (((b - 1) % sitesPerRow) * 100 / sitesPerRow) + '%';
                  divs.push(<div style={{width: blank_start_pcnt}} key={0}></div>)
                }
                let pcnt = ((e + 1 - b) * 100 / sitesPerRow - 1) + '%';
                console.log(n, b, e);
                divs.push(<div style={{width: '0.5%'}} key={idx + 20}></div>)
                divs.push(<div className={style['prevalence-viewer_struct_domain']} style={{width: pcnt}} key={idx+1}>{n}</div>)
                divs.push(<div style={{width: '0.5%'}} key={idx + 30}></div>)
                return n;
              });

              return divs;
            })()
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
