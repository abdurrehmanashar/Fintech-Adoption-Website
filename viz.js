(function(){
  const canvas = document.getElementById('populationCanvas');
  const tooltip = document.getElementById('vizTooltip');
  const legend = document.getElementById('vizLegend');
  if(!canvas || !tooltip || !legend) return;

  const ctx = canvas.getContext('2d');

  const COLORS = {
    excluded: '#C15B4A',
    engaged: '#3F8C77',
    female: '#C9A24B',
    male: '#3F5B66'
  };

  const clusters = [
    {
      id: 0, name: 'Digitally Excluded', share: 0.431, pctFemale: 0.963, pctExcluded: 0.893,
      summary: '43.1% of the sample - 96.3% women - 89.3% formally excluded'
    },
    {
      id: 1, name: 'Connected but Unengaged', share: 0.443, pctFemale: 0.163, pctExcluded: 0.668,
      summary: '44.3% of the sample - 16.3% women - 66.8% formally excluded despite near-universal access'
    },
    {
      id: 2, name: 'Advanced Adopters', share: 0.126, pctFemale: 0.103, pctExcluded: 0.008,
      summary: '12.6% of the sample - 10.3% women - only 0.8% excluded'
    }
  ];

  let mode = 'adoption';
  let W, H, dpr;

  function resize(){
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const chart = { left: 76, right: 28, top: 34, bottom: 92, maxShare: 0.5 };

  function yForShare(share){
    const plotH = H - chart.top - chart.bottom;
    return chart.top + (1 - share / chart.maxShare) * plotH;
  }

  function drawAxes(){
    const plotW = W - chart.left - chart.right;
    const plotH = H - chart.top - chart.bottom;
    const axisColor = 'rgba(242,238,228,0.62)';
    const gridColor = 'rgba(242,238,228,0.10)';

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chart.left, chart.top);
    ctx.lineTo(chart.left, chart.top + plotH);
    ctx.lineTo(chart.left + plotW, chart.top + plotH);
    ctx.stroke();

    ctx.font = '12px IBM Plex Mono, monospace';
    ctx.fillStyle = 'rgba(242,238,228,0.78)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for(let tick = 0; tick <= 50; tick += 10){
      const share = tick / 100;
      const y = yForShare(share);
      ctx.strokeStyle = tick === 0 ? axisColor : gridColor;
      ctx.beginPath();
      ctx.moveTo(chart.left - 6, y);
      ctx.lineTo(chart.left + plotW, y);
      ctx.stroke();
      ctx.fillText(tick + '%', chart.left - 12, y);
    }

    ctx.save();
    ctx.translate(22, chart.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('Share of sample', 0, 0);
    ctx.restore();

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Population cluster', chart.left + plotW / 2, H - 16);
  }

  function draw(){
    ctx.clearRect(0, 0, W, H);
    drawAxes();

    const plotW = W - chart.left - chart.right;
    const plotH = H - chart.top - chart.bottom;
    const slot = plotW / clusters.length;
    const barW = Math.min(116, slot * 0.48);

    clusters.forEach((cl, index) => {
      const x = chart.left + slot * index + slot / 2;
      const barX = x - barW / 2;
      const totalH = (cl.share / chart.maxShare) * plotH;
      const barBottom = chart.top + plotH;
      const primaryShare = mode === 'adoption' ? cl.pctExcluded : cl.pctFemale;
      const primaryH = totalH * primaryShare;
      const secondaryH = totalH - primaryH;
      const primaryColor = mode === 'adoption' ? COLORS.excluded : COLORS.female;
      const secondaryColor = mode === 'adoption' ? COLORS.engaged : COLORS.male;

      ctx.globalAlpha = 0.94;
      ctx.fillStyle = secondaryColor;
      ctx.fillRect(barX, barBottom - totalH, barW, secondaryH);
      ctx.fillStyle = primaryColor;
      ctx.fillRect(barX, barBottom - primaryH, barW, primaryH);
      ctx.globalAlpha = 1;

      ctx.strokeStyle = 'rgba(242,238,228,0.28)';
      ctx.strokeRect(barX, barBottom - totalH, barW, totalH);

      ctx.font = '600 13px IBM Plex Mono, monospace';
      ctx.fillStyle = 'rgba(242,238,228,0.95)';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText((cl.share * 100).toFixed(1) + '%', x, barBottom - totalH - 8);

      ctx.font = '12px IBM Plex Sans, sans-serif';
      ctx.fillStyle = 'rgba(242,238,228,0.78)';
      ctx.textBaseline = 'top';
      const words = cl.name.split(' ');
      const labelLines = words.length > 2 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [cl.name];
      labelLines.forEach((line, lineIndex) => {
        ctx.fillText(line, x, barBottom + 14 + lineIndex * 16);
      });
    });
  }

  function renderLegend(){
    if(mode === 'adoption'){
      legend.innerHTML =
        '<div class="legend-item"><span class="legend-dot" style="background:' + COLORS.excluded + '"></span> Formally excluded</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:' + COLORS.engaged + '"></span> Digitally engaged / included</div>';
    } else {
      legend.innerHTML =
        '<div class="legend-item"><span class="legend-dot" style="background:' + COLORS.female + '"></span> Women</div>' +
        '<div class="legend-item"><span class="legend-dot" style="background:' + COLORS.male + '"></span> Men</div>';
    }
  }

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    let nearest = null;
    let nearestDist = Infinity;
    const plotW = W - chart.left - chart.right;
    const plotH = H - chart.top - chart.bottom;
    const slot = plotW / clusters.length;
    const barW = Math.min(116, slot * 0.48);

    clusters.forEach((cl, index) => {
      const x = chart.left + slot * index + slot / 2;
      const totalH = (cl.share / chart.maxShare) * plotH;
      const barTop = chart.top + plotH - totalH;
      const withinX = mx >= x - barW / 2 && mx <= x + barW / 2;
      const withinY = my >= barTop && my <= chart.top + plotH;
      const dist = Math.abs(mx - x);
      if(withinX && withinY && dist < nearestDist){
        nearestDist = dist;
        nearest = cl;
      }
    });

    if(nearest){
      tooltip.innerHTML = '<strong>' + nearest.name + '</strong>' + nearest.summary;
      tooltip.style.left = (e.clientX - rect.left + 16) + 'px';
      tooltip.style.top = (e.clientY - rect.top + 16) + 'px';
      tooltip.style.opacity = '1';
    } else {
      tooltip.style.opacity = '0';
    }
  });

  canvas.addEventListener('mouseleave', () => { tooltip.style.opacity = '0'; });

  document.querySelectorAll('.toggle-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.toggle-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      mode = btn.getAttribute('data-mode');
      renderLegend();
      draw();
    });
  });

  function init(){
    resize();
    renderLegend();
    draw();
  }

  window.addEventListener('resize', () => { resize(); draw(); });
  window.addEventListener('load', init);
  if(document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();

(function(){
  const table = document.getElementById('clusterProfileTable');
  if(!table) return;

  const headers = Array.from(table.querySelectorAll('th'));
  const tbody = table.querySelector('tbody');
  let activeColumn = -1;
  let direction = 1;

  function valueFor(row, columnIndex, sortType){
    const cell = row.cells[columnIndex];
    if(sortType === 'number') return Number(cell.dataset.value || cell.textContent.replace(/[^0-9.-]/g, ''));
    return cell.textContent.trim().toLowerCase();
  }

  headers.forEach((header, columnIndex) => {
    const button = header.querySelector('button');
    if(!button) return;

    button.addEventListener('click', () => {
      direction = activeColumn === columnIndex ? direction * -1 : 1;
      activeColumn = columnIndex;

      const sortType = button.dataset.sort;
      const rows = Array.from(tbody.querySelectorAll('tr'));
      rows.sort((a, b) => {
        const aValue = valueFor(a, columnIndex, sortType);
        const bValue = valueFor(b, columnIndex, sortType);
        if(aValue < bValue) return -1 * direction;
        if(aValue > bValue) return 1 * direction;
        return 0;
      });

      headers.forEach((nextHeader) => nextHeader.removeAttribute('aria-sort'));
      header.setAttribute('aria-sort', direction === 1 ? 'ascending' : 'descending');
      rows.forEach((row) => tbody.appendChild(row));
    });
  });
})();

(function(){
  const canvas = document.getElementById('clusterMapCanvas');
  const legend = document.getElementById('clusterMapLegend');
  if(!canvas || !legend) return;

  const ctx = canvas.getContext('2d');
  const clusterInfo = {
    0: { name: 'Digitally Excluded', color: '#C15B4A' },
    1: { name: 'Connected but Unengaged', color: '#3F8C77' },
    2: { name: 'Advanced Adopters', color: '#C9A24B' }
  };
  const chart = { left: 76, right: 32, top: 34, bottom: 76 };
  let points = [];
  let bounds = null;
  let W, H, dpr;

  function resize(){
    dpr = window.devicePixelRatio || 1;
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function parseCsv(text){
    const rows = text.trim().split(/\r?\n/);
    const headers = rows.shift().split(',').map((header) => header.trim().toLowerCase());
    const pc1Index = headers.indexOf('pc1');
    const pc2Index = headers.indexOf('pc2');
    const clusterIndex = headers.indexOf('cluster');
    if(pc1Index < 0 || pc2Index < 0 || clusterIndex < 0) return [];

    return rows.map((row) => {
      const cells = row.split(',');
      return {
        pc1: Number(cells[pc1Index]),
        pc2: Number(cells[pc2Index]),
        cluster: Number(cells[clusterIndex])
      };
      }).filter(isValidPoint);
    }

    function isValidPoint(point){
      return Number.isFinite(point.pc1) && Number.isFinite(point.pc2) && clusterInfo[point.cluster];
    }

    function setPoints(nextPoints){
      points = nextPoints.filter(isValidPoint);
      bounds = points.length ? getBounds() : null;
      if(!points.length){
        drawMessage('No PCA coordinates found.');
        return;
      }
      draw();
  }

  function getBounds(){
    const xs = points.map((point) => point.pc1);
    const ys = points.map((point) => point.pc2);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const padX = (maxX - minX) * 0.08 || 1;
    const padY = (maxY - minY) * 0.08 || 1;
    return { minX: minX - padX, maxX: maxX + padX, minY: minY - padY, maxY: maxY + padY };
  }

  function niceTicks(min, max, count){
    const span = max - min;
    const step = Math.pow(10, Math.floor(Math.log10(span / count)));
    const error = span / count / step;
    const niceStep = error >= 5 ? step * 5 : error >= 2 ? step * 2 : step;
    const start = Math.ceil(min / niceStep) * niceStep;
    const ticks = [];
    for(let tick = start; tick <= max; tick += niceStep){
      ticks.push(Math.abs(tick) < 1e-10 ? 0 : tick);
    }
    return ticks;
  }

  function xForPc(value){
    const plotW = W - chart.left - chart.right;
    return chart.left + ((value - bounds.minX) / (bounds.maxX - bounds.minX)) * plotW;
  }

  function yForPc(value){
    const plotH = H - chart.top - chart.bottom;
    return chart.top + (1 - (value - bounds.minY) / (bounds.maxY - bounds.minY)) * plotH;
  }

  function drawMessage(message){
    ctx.clearRect(0, 0, W, H);
    ctx.font = '13px IBM Plex Mono, monospace';
    ctx.fillStyle = 'rgba(242,238,228,0.72)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(message, W / 2, H / 2);
  }

  function drawAxes(){
    const plotW = W - chart.left - chart.right;
    const plotH = H - chart.top - chart.bottom;
    const axisColor = 'rgba(242,238,228,0.62)';
    const gridColor = 'rgba(242,238,228,0.10)';

    ctx.strokeStyle = axisColor;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(chart.left, chart.top);
    ctx.lineTo(chart.left, chart.top + plotH);
    ctx.lineTo(chart.left + plotW, chart.top + plotH);
    ctx.stroke();

    ctx.font = '12px IBM Plex Mono, monospace';
    ctx.fillStyle = 'rgba(242,238,228,0.76)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    niceTicks(bounds.minX, bounds.maxX, 6).forEach((tick) => {
      const x = xForPc(tick);
      ctx.strokeStyle = gridColor;
      ctx.beginPath();
      ctx.moveTo(x, chart.top);
      ctx.lineTo(x, chart.top + plotH + 6);
      ctx.stroke();
      ctx.fillText(tick.toFixed(1), x, chart.top + plotH + 12);
    });

    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    niceTicks(bounds.minY, bounds.maxY, 5).forEach((tick) => {
      const y = yForPc(tick);
      ctx.strokeStyle = gridColor;
      ctx.beginPath();
      ctx.moveTo(chart.left - 6, y);
      ctx.lineTo(chart.left + plotW, y);
      ctx.stroke();
      ctx.fillText(tick.toFixed(1), chart.left - 12, y);
    });

    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('PC1 (25.8% variance)', chart.left + plotW / 2, H - 16);

    ctx.save();
    ctx.translate(22, chart.top + plotH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText('PC2 (10.5% variance)', 0, 0);
    ctx.restore();
  }

  function draw(){
    resize();
    if(!points.length){
      drawMessage('Loading cluster map...');
      return;
    }

    ctx.clearRect(0, 0, W, H);
    drawAxes();
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(xForPc(point.pc1), yForPc(point.pc2), 3, 0, Math.PI * 2);
      ctx.fillStyle = clusterInfo[point.cluster].color;
      ctx.globalAlpha = 0.72;
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  }

  function renderLegend(){
    legend.innerHTML = Object.keys(clusterInfo).map((id) => {
      const cl = clusterInfo[id];
      return '<div class="legend-item"><span class="legend-dot" style="background:' + cl.color + '"></span> Cluster ' + id + ': ' + cl.name + '</div>';
    }).join('');
  }

  function init(){
    resize();
    renderLegend();
    drawMessage('Loading cluster map...');

    if(Array.isArray(window.PCA_CLUSTER_COORDS)){
      setPoints(window.PCA_CLUSTER_COORDS);
      return;
    }

    fetch('pca_cluster_coords.csv')
      .then((response) => {
        if(!response.ok) throw new Error('Unable to load PCA coordinates');
        return response.text();
      })
      .then((text) => {
        setPoints(parseCsv(text));
      })
      .catch(() => {
        drawMessage('Unable to load pca_cluster_coords.csv');
      });
  }

  window.addEventListener('resize', draw);
  window.addEventListener('load', init);
  if(document.readyState === 'complete') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
