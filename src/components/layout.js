import React from "react"
import { Helmet } from "react-helmet"
import { css } from "@emotion/core"
import { useStaticQuery, graphql } from "gatsby"

import { rhythm } from "../utils/typography"
import Header from "./header"
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
			padding: ${rhythm(1.5)};
			padding-top: ${rhythm(1.5)};
			`}>
			<Helmet>
		      	<meta name="google-site-verification" content="Mss0Hxe25yLcF_RF5r9RCdZJNLRyMN9PVSGzKd5neb0" />
	    	  	<title>{title} | {data.site.siteMetadata.title}</title>
	    	</Helmet>
	    	<Header title={data.site.siteMetadata.title}/>
			<hr></hr>
			{children}
			<Footer/>
		</div>	
	)
}
