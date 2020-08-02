import React from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faTelegram, faGithub, faLinkedin, faTwitter, faInstagram, faFacebook } from '@fortawesome/free-brands-svg-icons'

import Layout from "../components/layout"


export default function Contact() {
	const alignCenter = { textAlign: 'center' }
	const faEnvelopeStyle = { color: '' }
	const faTelegramStyle = { color: '#0088cc' }
	const faGithubStyle = { color: '#24292e' }
	const faLinkedinStyle = { color: '#0e76a8' }
	const faTwitterStyle = { color: '#1DA1F2' }
	const faInstagramStyle = { color: '#C13584' }
	const faFacebookStyle = { color: '#4267B2' }

	return (
		<Layout title="Contact">
			<h1>Contact</h1>
			<h3>Feel free to contact me at </h3>
			<table>
				<tr>
					<td style={alignCenter}><FontAwesomeIcon icon={faEnvelope} size="2x" style={faEnvelopeStyle} /></td>
					<td><a href="mailto:rochim.noviyan@gmail.com">rochim.noviyan@gmail.com</a></td>
				</tr>
				<tr>
					<td style={alignCenter}><FontAwesomeIcon icon={faTelegram} size="2x" style={faTelegramStyle} /> </td>
					<td><a href="https://t.me/rochimfn">rochimfn</a></td>
				</tr>
				<tr>
					<td style={alignCenter}><FontAwesomeIcon icon={faGithub} size="2x" style={faGithubStyle} /> </td>
					<td><a href="https://github.com/rochimfn">rochimfn</a></td>
				</tr>
				<tr>
					<td style={alignCenter}><FontAwesomeIcon icon={faLinkedin} size="2x" style={faLinkedinStyle} /></td>
					<td><a href="https://www.linkedin.com/in/rochim-farul-noviyan-421292164">Rochim Farul Noviyan</a></td>
				</tr>
				<tr>
					<td style={alignCenter}><FontAwesomeIcon icon={faTwitter} size="2x" style={faTwitterStyle} /></td>
					<td><a href="https://twitter.com/rochimfn">rochimfn</a></td>
				</tr>
				<tr>
					<td style={alignCenter}><FontAwesomeIcon icon={faInstagram} size="2x" style={faInstagramStyle} /></td>
					<td><a href="https://instagram.com/rochim.noviyan">rochim.noviyan</a></td>
				</tr>
				<tr>
					<td style={alignCenter}><FontAwesomeIcon icon={faFacebook} size="2x" style={faFacebookStyle} /></td>
					<td><a href="https://www.facebook.com/rochim.farulnoviyan">Rochim Farul Noviyan</a></td>
				</tr>
			</table>
		</Layout>
	)
}
