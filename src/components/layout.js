import React from "react"
import { Helmet } from "react-helmet"
import { css } from "@emotion/core"
import { useStaticQuery, Link, graphql } from "gatsby"

import { rhythm } from "../utils/typography"
import Footer from "./footer"


export default function Layout({ children, title })
{
	const data = useStaticQuery(
		graphql`
			query {
				site {
					siteMetadata {
						title
					}
				}
			}
		`
	)
	return(
		<div css={css`
			margin: 0 auto;
			max-width: 800px;
			padding: ${rhythm(2)};
			padding-top: ${rhythm(1.5)};
			`}>
			<Helmet>
		      	<meta name="google-site-verification" content="Mss0Hxe25yLcF_RF5r9RCdZJNLRyMN9PVSGzKd5neb0" />
	    	  	<title>{title} | {data.site.siteMetadata.title}</title>
	    	</Helmet>
			<Link to={'/'}>
			<h2 css={css`
				margin-bottom: ${rhythm(2)};
				display: inline-block;
				font-style: normal;
				`}> {data.site.siteMetadata.title}</h2>
			</Link>
			<Link to={'/about/'} css={css`
				float: right;
				text-decoration: none;
			`}>
			About
			</Link>

			<Link to={'/contact/'} css={css`
				float: right;
				margin-right: ${rhythm(2)};
				text-decoration: none;
			`}>
			Contact
			</Link>
			
			<Link to={'/blog/'} css={css`
				float: right;
				margin-right: ${rhythm(2)};
				text-decoration: none;
			`}>
			Blog
			</Link>
			<hr></hr>
			{children}
			<Footer/>
		</div>	
	)
}
