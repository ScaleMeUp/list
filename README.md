# EditorJS List
- Added many list types
- Added spacing options

**Install**
`yarn add https://github.com/ScaleMeUp/list`

**Usage**
```js

import List from '@scalemeup/editor-js-list';

new EditorJS({
    tools: {
        list: {
            class: List,
            config: {
                defaultStyle: 'numbered',
                defaultSpacing: 'normal',
            }
        },
    },
})
```