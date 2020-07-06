/**
 * Configure your Gatsby site with this file.
 *
 * See: https://www.gatsbyjs.org/docs/gatsby-config/
 */

module.exports = {
  siteMetadata: {
  	title: `Rochim's Log`
  },
  plugins: [
    `gatsby-plugin-react-helmet`, 	
  	`gatsby-plugin-sharp`,
  	`gatsby-plugin-emotion`,
    `gatsby-plugin-fontawesome-css`,
  	{
  		resolve: `gatsby-transformer-remark`,
  		options: {
  			plugins: [
	  			{
	  				resolve: `gatsby-remark-images`,
	  				options: {
	  					maxWidth: 800,
	  				},
	  			},
	  			{
            resolve: `gatsby-remark-prismjs`,
            options: {},
	  			},
  			],
  		},
  	},
  	{
  		resolve: `gatsby-source-filesystem`,
  		options: {
  			name: `src`,
  			path: `${__dirname}/src/`
  		}
  	},
  	{
  		resolve: `gatsby-plugin-typography`,
  		options: {
  			pathToConfigModule : `src/utils/typography`,
  		},
  	},
  ],
}
