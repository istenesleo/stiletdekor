// @vitest-environment jsdom
import { Blob as NodeBlob } from 'node:buffer';
import { describe, expect, it } from 'vitest';
import { claudeDesignDokumentum, propAlapertekek } from './claude-design.mjs';

const PROPS = '{&quot;direction&quot;:{&quot;editor&quot;:&quot;enum&quot;,&quot;options&quot;:[&quot;A&quot;,&quot;B&quot;,&quot;C&quot;],&quot;default&quot;:&quot;C&quot;,&quot;tsType&quot;:&quot;\'A\'|\'B\'|\'C\'&quot;}}';
const FILE = [
  '<!DOCTYPE html><html><head><script src="./support.js"></script></head><body>',
  '<x-dc><a href="Stilet Tablo.dc.html">Tabló</a><a href="https://x.hu">K</a></x-dc>',
  `<script type="text/x-dc" data-dc-script data-props="${PROPS}">const a = 1;</script>`,
  '</body></html>',
].join('');

describe('propAlapertekek', () => {
  it('changes the default of a declared prop and keeps the rest', () => {
    const out = propAlapertekek(FILE, { direction: 'A' });
    const doc = new DOMParser().parseFromString(out, 'text/html');
    const props = JSON.parse(doc.querySelector('script[data-dc-script]').getAttribute('data-props'));
    expect(props.direction.default).toBe('A');
    expect(props.direction.options).toEqual(['A', 'B', 'C']);
    expect(props.direction.tsType).toBe("'A'|'B'|'C'");
  });

  it('refuses a prop the file does not have, and a file without props', () => {
    expect(() => propAlapertekek(FILE, { brand: '#fff' })).toThrow('Nincs ilyen prop: brand');
    expect(() => propAlapertekek('<p>x</p>', { direction: 'A' })).toThrow('data-props');
  });
});

describe('claudeDesignDokumentum', () => {
  const support = 'window.runtime = "</script> ok";';

  it('puts the runtime inline, so the file needs no neighbours', () => {
    const out = claudeDesignDokumentum(FILE, { support });
    expect(out).not.toContain('src="./support.js"');
    const doc = new DOMParser().parseFromString(out, 'text/html');
    expect(doc.querySelector('head script').textContent).toBe('window.runtime = "<\\/script> ok";');
  });

  it('turns links between the files into tab switches, leaving other links alone', () => {
    const out = claudeDesignDokumentum(FILE, { support, linkek: { 'Stilet Tablo.dc.html': 'cd-tablo' } });
    expect(out).toContain('<a href="#cd-tablo" target="_top">Tabló</a>');
    expect(out).toContain('<a href="https://x.hu">K</a>');
  });

  it('hands the imported files to the runtime as blobs, before the runtime runs', async () => {
    const sibling = '<x-dc><p>Prototípus </script><!-- x --></p></x-dc>';
    const out = claudeDesignDokumentum(FILE, { support, testverek: { StiletPrototipus: sibling } });
    const doc = new DOMParser().parseFromString(out, 'text/html');
    const [resources, runtime] = doc.querySelectorAll('head script');
    expect(runtime.textContent).toContain('window.runtime');
    const win = {};
    new Function('window', 'Blob', resources.textContent)(win, NodeBlob);
    expect(win.__resources).toEqual({ './StiletPrototipus.dc.html': 'beagyazott:StiletPrototipus' });
    expect(await win.__resourceBlobs['beagyazott:StiletPrototipus'].text()).toBe(sibling);
  });

  it('tells, where scripts do not run, that the tab needs a browser', () => {
    const doc = new DOMParser().parseFromString(claudeDesignDokumentum(FILE, { support }), 'text/html');
    expect(doc.body.firstElementChild.tagName).toBe('NOSCRIPT');
    expect(doc.body.firstElementChild.textContent).toContain('Nyisd meg a fájlt böngészőben');
  });

  it('refuses a file that does not load ./support.js', () => {
    expect(() => claudeDesignDokumentum('<p>x</p>', { support })).toThrow('support.js');
  });
});
