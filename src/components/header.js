import React from "react"
import { Link } from "gatsby"

export default function Header({ title })
{
	const divStyle = {overflow: 'hidden'}
	const titleStyle = {display: 'inline-block'}
	const linkStyle = {textDecoration: 'none', float: 'right', marginRight: '10px'}
	return(
		<div style={divStyle}>
			<Link to={'/'}><h2 style={titleStyle} >{title}</h2></Link>
			<Link style={linkStyle} to={'/about/'}>About</Link>
			<Link style={linkStyle} to={'/contact/'}>Contact</Link>
			<Link style={linkStyle} to={'/blog/'}>Blog</Link>
		</div>
		)
}

