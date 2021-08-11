const yaml = require('js-yaml');
const fs = require('fs');
const glob = require('glob');
const path = require('path');
const matter = require('gray-matter');

const {defaultLocale} = require('./site.json');

/** @type AuthorsData */
const authorsData = require('./authorsData.json');
const authorsYaml =
  /** @type I18nAuthors */ (
    /** @type TODO */ yaml.load(
      fs.readFileSync(path.join(__dirname, 'i18n', 'authors.yaml'), 'utf-8')
    )
  ) || {};

/** @type PostsData */
const postsData = {
  authors: {},
};

/**
 * @param {string} authorKey
 * @param {FrontMatterData} fronMatter
 * @param {string} locale
 */
function addAuthorsPost(authorKey, fronMatter, locale) {
  if (authorKey in postsData.authors) {
    postsData.authors[authorKey].elements.push(fronMatter);
  } else {
    postsData.authors[authorKey] = {
      ...authorsData[authorKey],
      description: `i18n.authors.${authorKey}.description`,
      elements: [fronMatter],
      key: authorKey,
      locale,
      title: `i18n.authors.${authorKey}.title`,
      url: `/authors/${authorKey}/`,
    };
  }
}

glob('./site/[a-z][a-z]/{**/*,*}.md', {}, (er, files) => {
  if (er) {
    throw er;
  }

  /** @type {{locale: string, data: FrontMatterData}[]} */
  const fileContents = files
    .map(file => {
      const filePath = path.join(process.cwd(), file);
      const fileData = fs.readFileSync(filePath, 'utf8');
      let locale = defaultLocale;
      const groups = /\/site\/(?<locale>[a-z]{2})\/.*/.exec(file)?.groups;
      if (groups && groups.locale) {
        locale = groups.locale;
      }
      return {
        locale,
        data: matter(fileData).data,
      };
    })
    .filter(f => f.data.date)
    .sort((a, b) => a.data.date.getTime() - b.data.date.getTime());

  for (const fileContent of fileContents) {
    if (fileContent.data.authors) {
      for (const authorKey of fileContent.data.authors) {
        if (authorKey in authorsYaml) {
          addAuthorsPost(authorKey, fileContent.data, fileContent.locale);
        }
      }
    }
  }
});

module.exports = postsData;
