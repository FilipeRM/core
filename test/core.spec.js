const core = require('../dist/index');
const { expect } = require('chai');
const fs = require('fs');
const fetch = require('node-fetch');

/*describe('Core', function() {
  it('Should evaluate', async function() {
    this.timeout(10 * 10000);

    const report = await core.evaluate({ url: 'http://ciencias.ulisboa.pt'});
    //console.log(report);
    expect(report[0].type).to.be.equal('evaluation');
  });
  it('EARL report should have assertions from all modules', async function() {
    this.timeout(10 * 10000);

    const reports = await core.evaluate({ url: 'http://ciencias.ulisboa.pt'});
    const earlReports = await core.generateEarlReport();
    //await writeFile('report.json', JSON.stringify(reports, null, 2));
    expect(earlReports[0].graph.length).to.be.greaterThan(0);
  });
});

const URL = 'https://ciencias.ulisboa.pt';

describe('Testing plain html', function() {
  it.only('should run', async function() {
    this.timeout(1000 * 1000);
    const report = await core.evaluate({ url: URL });
    console.warn(report.system.dom.processed.html.plain);
    expect(report.system.dom.processed.html.plain).to.not.be.undefined;
  });
});*/

const URL = 'https://ciencias.ulisboa.pt';
const URL2 = 'http://accessible-serv.lasige.di.fc.ul.pt/~jvicente/test/video/';
const URL3 = 'http://accessible-serv.lasige.di.fc.ul.pt/~jvicente/test/';
const URL4 = 'http://www.visitilhavo.pt';
const URL5 = 'http://www.cm-pesoregua.pt';

describe('Testing new architecture', function() {
  it('should do something', async function() {
    this.timeout(1000 * 1000);

    const urls = [
      'http://accessible-serv.lasige.di.fc.ul.pt/~jvicente/test/',
      'https://ciencias.ulisboa.pt',
      'https://lodash.com',
      'https://lasige.di.fc.ul.pt/',
      'https://www.lasige.di.fc.ul.pt/',
      'https://www.cgd.pt/Particulares/Pages/Particulares_v2.aspx',
      'https://cgd.pt/Particulares/Pages/Particulares_v2.aspx',
      'https://www.alta.kommune.no/',
      'https://www.nav.no',
      'https://act-rules.github.io/testcases/bc659a/cbf6409b0df0b3b6437ab3409af341587b144969.html',
      'https://nkmal.no/kontakt'
    ];

    await core.start();
    //const reports = await core.evaluate({ urls: [URL3, URL2] , execute: { act: true }, 'act-rules': { rules: ['QW-ACT-R1'] }, maxParallelEvaluations: 2});
    const reports = await core.evaluate({ url: urls[1], execute: { html: true } });
    await core.close();
    console.log(reports);
    //const earlReports = await core.generateEarlReport();
    //console.log(JSON.stringify(earlReports, null, 2));
    //delete reports['https://nkmal.no/kontakt'].system.page.dom.source.html.parsed;
    //delete reports['https://nkmal.no/kontakt'].system.page.dom.stylesheets;
    //fs.writeFileSync('test/reports.json', JSON.stringify(reports['https://nkmal.no/kontakt'], null, 2));
  });
});

describe('Testing file with R37', function() {
  it('Should not have a heap memory', async function() {
    this.timeout(1000 * 1000);

    const urls = fs.readFileSync('/home/javicente/Downloads/urls4.txt');

    const reports = [];

    await core.start();

    for (const url of urls || []) {
      reports.push(await core.evaluate({ url, execute: { act: true }, 'act-rules': { rules: ['QW-ACT-R37'] } }));
    }

    await core.close();
    console.log(reports);
  });
});

describe.only('Testing crawler', function() {
  it('Should execute', async function() {
    this.timeout(1000 * 1000);
    await core.start();
    const reports = await core.evaluate({ crawl: 'https://ciencias.ulisboa.pt', maxParallelEvaluations: 5, execute: { act: true }, 'act-rules': { rules: ['QW-ACT-R1'] } });
    await core.close();
    console.log(reports);
  })
});

describe('Should do parallel evaluations', function() {
  it('should have correct results', async function() {
    this.timeout(1000 * 1000);
    const response = await fetch('https://act-rules.github.io/testcases.json')
    const testCases = JSON.parse(await response.json());
    const rule = 'b33eff';
    const tcs = testCases.testcases.filter(tc => tc.ruleId === rule);
    const urls = tcs.map(tc => tc.url);
    
    const options = {
      urls,
      execute: {
        act: true
      },
      'act-rules': {
        rules: [rule]
      },
      maxParallelEvaluations: urls.length
    };
    
    await core.evaluate(options);
    const earlReport = await core.generateEarlReport({ aggregated: true, modules: { act: true }});
    
    let valid = true;
    for (let i = 0 ; i < tcs.length ; i++) {
      try {
        const result = earlReport[0].graph.filter(r => r.source === tcs[i].url)[0];
        console.warn(result.source + '   ' + tcs[i].url);
        console.warn(result.assertions[0].result.outcome + '   earl:' + tcs[i].expected);
        
        if (result.assertions[0].result.outcome !== 'earl:' + tcs[i].expected) {
          valid = false;
        }
      } catch (err) {
        valid = false;
        console.error(err);
      }
    }

    if (valid) {
      console.warn('Test validation passed');
    } else {
      console.warn('Test validation failed');
    }
    expect(valid).to.be.true;
  });
});

