import React from "react"
import { Link } from "gatsby"

export default function Header({ title })
{
	const navStyle = { display: 'flex', justifyContent: 'space-between'}
	const titleStyle = {display: 'inline-block'}
	const linkStyle = {textDecoration: 'none', float: 'right', marginRight: '10px'}
	return(
		<nav style={navStyle}>
			<Link to={'/'}><h2 style={titleStyle} >{title}</h2></Link>
			<div>
				<Link style={linkStyle} to={'/about/'}>About</Link>
				<Link style={linkStyle} to={'/contact/'}>Contact</Link>
				<Link style={linkStyle} to={'/blog/'}>Blog</Link>
			</div>
		</nav>
		)
}

