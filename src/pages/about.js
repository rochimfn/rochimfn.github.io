import React from "react"
import { graphql } from "gatsby"
import Layout from "../components/layout"
import background from "../images/background.jpg"

export default function About({ data })
{
	return(
		<Layout title="About">
			<h1>About {data.site.siteMetadata.title}</h1>
			<img src={background} alt="Background"/>
			<br></br>
			<p><em>
				  “Rochim Farul Noviyan, biasa dipanggil <strong>Rochim</strong>, ialah seorang mahasiswa S1 Sistem Informasi di salah satu perguruan tinggi negeri di kota Surabaya. Menjadi seorang SysAdmin adalah cita - citanya dan menjadi dokter ialah impiannya (emang nggak nyambung sih, tapi yowislah… :D ). Saat ini sedang berusaha mendalami dunia <strong>front-end</strong> dan mulai merambah ke dunia <strong>back-end.</strong>”
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