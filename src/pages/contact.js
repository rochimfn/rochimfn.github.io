import React from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faGithub, faLinkedin, faTwitter, faInstagram, faFacebook } from '@fortawesome/free-brands-svg-icons'

import Layout from "../components/layout"


export default function Contact()
{
	const linkStyle = {
		display: 'inline-block',
		marginLeft: '1rem',
		marginBottom: '1rem'
	}
	const faEnvelopeStyle = {color: ''}
	const faGithubStyle = {color: '#24292e'}
	const faLinkedinStyle = {color: '#0e76a8'}
	const faTwitterStyle = {color: '#1DA1F2'}
	const faInstagramStyle = {color: '#C13584'}
	const faFacebookStyle = {color: '#4267B2'}

	return(
		<Layout title="Contact">
			<h1>Contact</h1>
			<h3>Feel free to contact me at </h3>

			<FontAwesomeIcon icon={faEnvelope} size="2x" style={faEnvelopeStyle}/>
			<a style={linkStyle} href="mailto:rochim.noviyan@gmail.com">rochim.noviyan@gmail.com</a><br/>

			<FontAwesomeIcon icon={faGithub} size="2x" style={faGithubStyle}/> 
	      	<a style={linkStyle} href="https://github.com/rochimfn">rochimfn</a><br/>

	      	<FontAwesomeIcon icon={faLinkedin} size="2x" style={faLinkedinStyle}/>
	    	<a style={linkStyle} href="https://www.linkedin.com/in/rochim-farul-noviyan-421292164">Rochim Farul Noviyan</a><br/>

	    	<FontAwesomeIcon icon={faTwitter} size="2x" style={faTwitterStyle}/>
      		<a style={linkStyle} href="https://twitter.com/rochimfn">rochimfn</a><br/>

      		<FontAwesomeIcon icon={faInstagram} size="2x" style={faInstagramStyle}/>
      		<a style={linkStyle} href="https://instagram.com/rochim.noviyan">rochim.noviyan</a><br/>

      		<FontAwesomeIcon icon={faFacebook} size="2x" style={faFacebookStyle}/>
      		<a style={linkStyle} href="https://www.facebook.com/rochim.farulnoviyan">Rochim Farul Noviyan</a><br/>
      		
		</Layout>
	)
}
