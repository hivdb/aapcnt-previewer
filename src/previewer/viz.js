import React from 'react'

import style from './style.module.scss'

export function get_domain_mark(chunk, sitesPerRow, preset_domain, style_name) {
  let pos_list = chunk.map(([pos]) => {
    return parseInt(pos);
  })
  let start = Math.min(...pos_list);
  let stop = Math.max(...pos_list);

  let sel_domain = preset_domain.filter(([s1, s2, n]) => {
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
  var scanned_pos = 0
  sel_domain.map(([s1, s2, n], idx) => {
    let b = s1;
    let e = s2;
    if (s1 < start) {
      b = start;
    }
    if (s2 > stop) {
      e = stop;
    }

    let begin_offset = b - start
    let new_scanned_pos = begin_offset - scanned_pos
    scanned_pos = begin_offset

    let gap_pcnt = new_scanned_pos / sitesPerRow * 100

    if (gap_pcnt) {
      divs.push(<div style={{width: gap_pcnt + '%'}} key={b+100}>&nbsp;</div>)
    }

    let domain_pos = (e + 1 - b)
    let pcnt = domain_pos / sitesPerRow * 100;
    // console.log(n, b, e);
    // console.log(used_pcnt, gap_pcnt, pcnt);

    scanned_pos += domain_pos;

    divs.push(
      <div className={style[style_name]} style={{width: pcnt  + '%'}} key={b}>
        {n}
      </div>)
    return n;
  });

  return divs;
}


export function get_special_pos_mark(chunk, sitesPerRow, special_pos) {
  let pos_list = chunk.map(([pos]) => {
    return parseInt(pos);
  })
  let start = Math.min(...pos_list);
  let stop = Math.max(...pos_list);

  special_pos = special_pos['lena_resist'].map((pos) => {
    return [pos, 'lena_resist']
  }).concat(special_pos['lena_pocket'].map((pos) => {
    return [pos, 'lena_pocket']
  })).concat(special_pos['hla_pos'].map((pos) => {
    return [pos, 'hla_pos']
  }))
  special_pos.sort(([pos1, c1], [pos2, c2]) => {
    return pos1 - pos2
  })

  var divs = []
  var scanned_pos = 0
  special_pos.map(([pos, category]) => {
    if (pos < start || pos > stop) {
      return null;
    }
    let pos_offset = pos - start
    let new_scanned_pos = pos_offset - scanned_pos
    scanned_pos = pos_offset
    let gap_pcnt = new_scanned_pos / sitesPerRow * 100

    let pcnt = 1 / sitesPerRow * 100
    scanned_pos += 1

    if (gap_pcnt !== 0) {
      divs.push(<div style={{width: gap_pcnt  + '%'}}  key={pos + 100}>&nbsp;</div>)
    }

    let style_name = 'prevalence-view_lena_pocket'
    if (category === 'lena_resist') {
      style_name = 'prevalence-view_lena_resist'
    } else if (category === 'hla_pos') {
      style_name = 'prevalence-view_hla_pos'
    }
    divs.push(
      <div style={{width: pcnt + '%'}} key={pos}>
        <div className={style[style_name]}>&nbsp;</div>
      </div>)
    return null
  })

  return divs
}
