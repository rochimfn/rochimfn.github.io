import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import background from "../images/background.jpg"

export default function About({ data })
{
	const imgStyle = {
		borderRadius : '50%',
		display: 'block',
		marginLeft: 'auto',
		marginRight : 'auto',
		marginTop: '2rem',
		marginBottom: '1rem',
		maxHeight: '250px'
	}
	return(
		<Layout title="About">
			<h1>About {data.site.siteMetadata.title}</h1>
			<img style={imgStyle} src={background} alt="Background"/>
			<br></br>
			<p><em>
				  “Gambar diatas, Rochim Farul Noviyan, biasa dipanggil <strong>Rochim</strong>, merupakan seorang mahasiswa S1 Sistem Informasi di salah satu perguruan tinggi negeri di kota Surabaya. Bercita - cita menjadi SysAdmin. Namun dalam perjalanannya ia terjerumus dalam dunia menakjubkan Web Development.
	      </em></p>
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