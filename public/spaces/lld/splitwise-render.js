(() => {
  const majorHeadings = new Map([
    ['1. Requirements', 'requirements'],
    ['2. Class design', 'class-design'],
    ['3. Complete single-file Java implementation', 'implementation'],
    ['4. Most important logic: BalanceSheet', 'balance-sheet'],
    ['5. Topics you should know for this LLD', 'topics'],
    ['6. Where SOLID principles apply', 'solid'],
    ['7. Common interview follow-up questions', 'questions'],
    ['8. Improvements for a production-grade Splitwise', 'improvements'],
    ['9. Recommended preparation order', 'preparation-order']
  ]);

  const response = document.getElementById('original-response');
  let activeMajor = '';
  let implementationDetails = null;
  let simpleImplementation = '';

  function element(tag, text, className) {
    const node = document.createElement(tag);
    if (text !== undefined) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function image(src, alt) {
    const img = document.createElement('img');
    img.className = 'response-image';
    img.src = src;
    img.alt = alt;
    return img;
  }

  function renderTable(lines, start) {
    const rows = [];
    let index = start;
    while (index < lines.length && lines[index].includes('\t')) {
      rows.push(lines[index].split('\t'));
      index += 1;
    }
    const wrap = element('div', undefined, 'table-wrap');
    const table = document.createElement('table');
    rows.forEach((cells, rowIndex) => {
      const row = document.createElement('tr');
      cells.forEach((cell) => row.appendChild(element(rowIndex === 0 ? 'th' : 'td', cell)));
      (rowIndex === 0 ? table.createTHead() : table.createTBody()).appendChild(row);
    });
    wrap.appendChild(table);
    response.appendChild(wrap);
    return index - 1;
  }

  Promise.all([
    fetch('../content/splitwise-response.txt'),
    fetch('../content/splitwise-simple-implementation.java')
  ])
    .then(async ([responseResult, simpleResult]) => {
      if (!responseResult.ok) throw new Error('Unable to load the original response');
      if (!simpleResult.ok) throw new Error('Unable to load the simple implementation');
      return [await responseResult.text(), await simpleResult.text()];
    })
    .then(([text, simpleText]) => {
      simpleImplementation = simpleText;
      const lines = text.replace(/\r\n/g, '\n').split('\n');

      for (let i = 1; i < lines.length; i += 1) {
        const line = lines[i];
        if (!line.trim()) continue;

        if (line === 'Example') {
          const captured = [];
          while (i < lines.length && lines[i] !== '2. Class design') {
            if (lines[i].trim()) captured.push(lines[i]);
            i += 1;
          }
          i -= 1;
          response.appendChild(image('../images/splitwise-expense-example.png', captured.join(' ')));
          continue;
        }

        if (line === '2. Class design') {
          activeMajor = line;
          const section = element('section');
          section.id = 'class-design';
          section.appendChild(element('h2', line, 'sr-only'));
          section.appendChild(image('../images/splitwise-class-design.png', line));
          response.appendChild(section);
          continue;
        }

        if (line === 'import java.math.BigDecimal;') {
          const code = [];
          while (i < lines.length && lines[i] !== 'Run the code') {
            code.push(lines[i]);
            i += 1;
          }
          i -= 1;
          const pre = document.createElement('pre');
          pre.className = 'code-file';
          pre.appendChild(element('code', code.join('\n').trimEnd()));
          implementationDetails.appendChild(pre);
          continue;
        }

        if (line === 'Run the code') {
          implementationDetails.appendChild(element('h3', line));
          const commands = [];
          i += 1;
          while (i < lines.length && lines[i] !== 'Expected output') {
            if (lines[i].trim()) commands.push(lines[i]);
            i += 1;
          }
          i -= 1;
          const pre = document.createElement('pre');
          pre.appendChild(element('code', commands.join('\n')));
          implementationDetails.appendChild(pre);
          continue;
        }

        if (line === 'Expected output') {
          implementationDetails.appendChild(element('h3', line));
          const output = [];
          i += 1;
          while (i < lines.length && lines[i] !== '4. Most important logic: BalanceSheet') {
            output.push(lines[i]);
            i += 1;
          }
          i -= 1;
          const pre = document.createElement('pre');
          pre.className = 'expected-output';
          pre.appendChild(element('code', output.join('\n').trim()));
          implementationDetails.appendChild(pre);
          continue;
        }

        if (line.includes('\t')) {
          i = renderTable(lines, i);
          continue;
        }

        if (majorHeadings.has(line)) {
          activeMajor = line;
          const heading = element('h2', line);
          heading.id = majorHeadings.get(line);
          response.appendChild(heading);

          if (line === '3. Complete single-file Java implementation') {
            implementationDetails = element('details', undefined, 'implementation-toggle');
            implementationDetails.appendChild(element('summary', 'Complete implementation'));
            response.appendChild(implementationDetails);
          } else if (line === '4. Most important logic: BalanceSheet') {
            const simpleDetails = element('details', undefined, 'implementation-toggle');
            simpleDetails.appendChild(element('summary', 'Simple implementation'));
            const simpleCode = document.createElement('pre');
            simpleCode.className = 'code-file';
            simpleCode.appendChild(element('code', simpleImplementation));
            simpleDetails.appendChild(simpleCode);
            heading.before(simpleDetails);
            implementationDetails = null;
          }
          continue;
        }

        if (line === 'Functional requirements' ||
            line === 'Interview preparation progress' ||
            line === 'Before netting' || line === 'After netting' ||
            ((activeMajor.startsWith('5.') || activeMajor.startsWith('7.')) && /^\d+\. /.test(line))) {
          response.appendChild(element('h3', line));
          continue;
        }

        const className = line.startsWith('[ ] ') ? 'checklist-line' :
          line.startsWith('- ') ? 'bullet-line' : 'response-line';
        (implementationDetails || response).appendChild(element('p', line, className));
      }
    })
    .catch((error) => {
      response.appendChild(element('p', error.message, 'response-error'));
    });
})();
