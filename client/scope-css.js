import cssModule from 'css';
import fs from 'fs';

const css = cssModule.parse(fs.readFileSync('src/pages/Home.css', 'utf8'));

css.stylesheet.rules.forEach(rule => {
    if (rule.type === 'rule') {
        rule.selectors = rule.selectors.map(s => {
            if (s === 'body' || s === 'html' || s === ':root' || s.includes('.advanced-home')) return s;
            return '.advanced-home ' + s;
        });
    } else if (rule.type === 'media') {
        rule.rules.forEach(r => {
            if (r.type === 'rule') {
                r.selectors = r.selectors.map(s => {
                    if (s === 'body' || s === 'html' || s === ':root' || s.includes('.advanced-home')) return s;
                    return '.advanced-home ' + s;
                });
            }
        });
    }
});

fs.writeFileSync('src/pages/Home.css', cssModule.stringify(css));
console.log('Successfully scoped Home.css');
