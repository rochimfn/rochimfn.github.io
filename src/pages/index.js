import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import { css } from "@emotion/core"

export default function Home({ data })
{
	return(
		<Layout title={data.site.siteMetadata.title}>
		<h1 css={css`color: teal; text-align: center; font-size: xxx-large; font-weight: bolder; margin-top: 100px; margin-bottom: 100px; text-decoration: underline;`}>{data.site.siteMetadata.title}</h1>
			<div>
          		<blockquote>
					  <p>"Web ini berisikan catatan - catatan sebagai pengingat di masa yang akan datang"</p>
				</blockquote>
			</div>
		</Layout>
	)
}

export const query = graphql`
	query {
		site {
			siteMetadata {
				title
			}
		}
	}
`