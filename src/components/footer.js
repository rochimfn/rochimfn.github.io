import React from "react"
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-regular-svg-icons'
import { faGithub, faLinkedin, faTwitter, faInstagram, faFacebook } from '@fortawesome/free-brands-svg-icons'

export default function Footer()
{
	const footerStyle = {marginTop: '5rem', textAlign: 'center'}
	
	
	const faEnvelopeStyle = {color: '', marginRight: '10px'}
	const faGithubStyle = {color: '#24292e', marginRight: '10px'}
	const faLinkedinStyle = {color: '#0e76a8', marginRight: '10px'}
	const faTwitterStyle = {color: '#1DA1F2', marginRight: '10px'}
	const faInstagramStyle = {color: '#C13584', marginRight: '10px'}
	const faFacebookStyle = {color: '#4267B2', marginRight: '10px'}

	return(
		<footer style={footerStyle}>
		  <p>By <a href="http://rochimfn.github.io/contact/">Rochim</a></p>
		  
		    <a href="mailto:rochim.noviyan@gmail.com"><FontAwesomeIcon icon={faEnvelope} size="2x" style={faEnvelopeStyle}/></a>
		    <a href="https://github.com/rochimfn"><FontAwesomeIcon icon={faGithub} size="2x" style={faGithubStyle}/></a>
		    <a href="https://www.linkedin.com/in/rochim-farul-noviyan-421292164"><FontAwesomeIcon icon={faLinkedin} size="2x" style={faLinkedinStyle}/></a>
		    <a href="https://twitter.com/rochimfn"><FontAwesomeIcon icon={faTwitter} size="2x" style={faTwitterStyle}/></a>
		    <a href="https://instagram.com/rochim.noviyan"><FontAwesomeIcon icon={faInstagram} size="2x" style={faInstagramStyle}/></a>
		    <a href="https://www.facebook.com/rochim.farulnoviyan"><FontAwesomeIcon icon={faFacebook} size="2x" style={faFacebookStyle}/></a>
		</footer>
	)
}