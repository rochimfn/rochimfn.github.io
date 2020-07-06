import Typography from "typography"
import funstonTheme from 'typography-theme-funston'
funstonTheme.baseFontSize = '16px'
funstonTheme.headerFontFamily = ['Lato', 'sans-serif']
funstonTheme.bodyFontFamily = ['Roboto', 'sans-serif']
funstonTheme.googleFonts= [
  {
    name: 'Roboto',
    styles: [
      '400',
      '400i',
    ],
  },
  {
    name: 'Lato',
    styles: [
      '400',
      '700',
    ],
  },
]
funstonTheme.overrideThemeStyles = ({ rhythm }, options) => ({
  'code': {
    fontSize: rhythm(1/2)+'!important',
    lineHeight: 1+'!important'
  }
})

const typography = new Typography(funstonTheme)

export default typography
export const rhythm = typography.rhythm