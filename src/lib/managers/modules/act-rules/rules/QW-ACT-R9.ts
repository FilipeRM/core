'use strict';

import {ElementHandle, Page} from 'puppeteer';
import Rule from './Rule.object';
import {ACTRule, ACTRuleResult} from '@qualweb/act-rules';
import {AccessibilityTreeUtils, DomUtils} from '../../../util/index';


const rule: ACTRule = {
  name: 'Links with identical accessible names have equivalent purpose',
  code: 'QW-ACT-R9',
  mapping: 'b20e66',
  description: 'This rule checks that links with identical accessible names resolve to the same resource or equivalent resources.',
  metadata: {
    target: {
      element: 'a,[role="link"]'
    },
    'success-criteria': [{
      name: '2.4.9',
      level: 'AAA',
      principle: 'Operable',
      url: 'https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-link-only.html'
    }],
    related: [],
    url: 'https://act-rules.github.io/rules/b20e66',
    passed: 0,
    inapplicable: 0,
    failed: 0,
    warning: 0,
    type: ['ACTRule', 'TestCase'],
    a11yReq: ['WCAG21:language'],
    outcome: '',
    description: ''
  },
  results: new Array<ACTRuleResult>()
};

class QW_ACT_R9 extends Rule {

  constructor() {
    super(rule);
  }


  async execute(element: ElementHandle | undefined, page: Page): Promise<void> {
    let evaluation: ACTRuleResult = {
      verdict: '',
      description: '',
      resultCode: ''
    };


    if (element === undefined) { // if the element doesn't exist, there's nothing to test
      evaluation.verdict = 'inapplicable';
      evaluation.description = `body element doesn't exist`;
      evaluation.resultCode = 'RC1';
    } else {
      let links = await element.$$('a[href],[role="link"]');
      let accessibleNames: string[] = [];
      let parent, aName;

      for (let link of links) {
        parent = await DomUtils.getElementParent(element);
        if (parent !== null && await DomUtils.getElementName(parent) !== 'svg') {
          aName = await AccessibilityTreeUtils.getAccessibleName(link, page);
          if (aName) {
            accessibleNames.push(aName);
          }

        }
      }

      let counter = 0;
      let hasEqualAn: number[];
      let blacklist: number[] = [];
      let selector:string[] = [];
      for (let accessibleName of accessibleNames) {
        hasEqualAn = [];
        if (blacklist.indexOf(counter) >= 0) {
          //element already evaluated
        } else if (accessibleName && accessibleName !== "") {
          hasEqualAn = this.isInListExceptIndex(accessibleName, accessibleNames, counter);
          if (hasEqualAn.length > 0) {
            blacklist.push(...hasEqualAn);

            for (let index of hasEqualAn) {
              selector.push( await DomUtils.getElementSelector(links[index]));
              }
            let hashArray = await this.getContentHash(selector,page);
            let firstHash = hashArray.pop();
            let result = true;
            for (let hash of hashArray) {
              if (!firstHash || !hashArray || hash !== firstHash) {
                result = false;
              }
            }
            if (result) {//passed
              evaluation.verdict = 'passed';
              evaluation.description = `Links with the same accessible name have equal content`;
              evaluation.resultCode = 'RC2';

            } else { //warning
              evaluation.verdict = 'warning';
              evaluation.description = `Links with the same accessible name have different content.Verify is the content is equivalent`;
              evaluation.resultCode = 'RC3';

            }

          } else {//inaplicable
            evaluation.verdict = 'inapplicable';
            evaluation.description = `There is no link with same the same accessible name`;
            evaluation.resultCode = 'RC4';
          }
          evaluation.htmlCode = await DomUtils.getElementHtmlCode(links[counter]);
          evaluation.pointer = await DomUtils.getElementSelector(links[counter]);
          super.addEvaluationResult(evaluation);
          evaluation = {
            verdict: '',
            description: '',
            resultCode: ''
          };
        } else {//inaplicable
          evaluation.verdict = 'inapplicable';
          evaluation.description = `link doesnt have accessible name`;
          evaluation.resultCode = 'RC4';

          evaluation.htmlCode = await DomUtils.getElementHtmlCode(links[counter]);
          evaluation.pointer = await DomUtils.getElementSelector(links[counter]);
          super.addEvaluationResult(evaluation);
          evaluation = {
            verdict: '',
            description: '',
            resultCode: ''
          };

        }
        hasEqualAn = [];
        selector = [];

        counter++;
      }


    }


  }

  private async getContentHash(selectors: string[], page: Page) {
    let browser = await page.browser();
    const newPage = await browser.newPage();
    let content: string[] = [];
    let hash, htmlContent;
    try {
      for (let selector of selectors) {
        await newPage.goto(await page.url(), {'waitUntil': 'networkidle0'});
        await page.click(selector);
        htmlContent = await page.evaluate(() => {
          return document.documentElement.innerHTML;
        });
        if(htmlContent){
          hash = htmlContent;//fixme md5
        }
        content.push(hash);
      }
    } catch (e) {
    }
    ;

    await newPage.close();
    return content;
  }

  private isInListExceptIndex(accessibleName: string, accessibleNames: string[], index: number) {
    let counter = 0;
    let result: number[] = [];
    for (let accessibleNameToCompare of accessibleNames) {
      if (accessibleNameToCompare === accessibleName && counter !== index) {
        result.push(counter);
      }
      counter++;
    }

    return result;
  }

}

export = QW_ACT_R9;
