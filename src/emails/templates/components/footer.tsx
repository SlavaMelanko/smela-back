/** @jsxImportSource react */

import {
  Link,
  Section,
  Text,
} from '@react-email/components'

import { config } from '../../config'
import styles from '../styles'

interface SocialLink {
  href: string
  icon: React.ReactNode
  label: string
}

interface FooterProps {
  companyName?: string
  socialLinks?: SocialLink[]
}

const footerStyles = {
  footer: {
    textAlign: 'center' as const,
    fontSize: styles.font.size.xs,
    color: styles.color.text.muted,
    marginTop: styles.spacing.md,
  },
  social: {
    display: 'flex',
    justifyContent: 'center',
    gap: styles.spacing.md,
    marginBottom: styles.spacing.md,
  },
  icon: {
    width: '24px',
    height: '24px',
    stroke: styles.color.text.muted,
    strokeWidth: '1.5',
    fill: 'none',
  },
}

const getSocialIcon = (platform: string): React.ReactNode => {
  const icons: Record<string, React.ReactNode> = {
    twitter: (
      <svg
        style={footerStyles.icon}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66
         10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0
         20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"
        />
      </svg>
    ),
    facebook: (
      <svg
        style={footerStyles.icon}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1
         0 0 1 1-1h3z"
        />
      </svg>
    ),
    linkedin: (
      <svg
        style={footerStyles.icon}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
    instagram: (
      <svg
        style={footerStyles.icon}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    github: (
      <svg
        style={footerStyles.icon}
        viewBox="0 0 24 24"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22" />
      </svg>
    ),
  }

  return icons[platform.toLowerCase()] || null
}

const getDefaultSocialLinks = (): SocialLink[] => {
  const links: SocialLink[] = []

  Object.entries(config.company.social).forEach(([platform, url]) => {
    if (url) {
      const icon = getSocialIcon(platform)
      if (icon) {
        links.push({
          href: url,
          label: platform.charAt(0).toUpperCase() + platform.slice(1),
          icon,
        })
      }
    }
  })

  return links
}

const Footer = ({
  companyName = config.company.name,
  socialLinks = getDefaultSocialLinks(),
}: FooterProps) => {
  const year = new Date().getFullYear()

  return (
    <Section style={footerStyles.footer}>
      <div style={footerStyles.social}>
        {socialLinks.map((social, index) => (
          <Link key={index} href={social.href} aria-label={social.label}>
            {social.icon}
          </Link>
        ))}
      </div>
      <Text style={footerStyles.footer}>
        ©
        {' '}
        {year}
        {' '}
        {companyName}
        , All Rights Reserved
      </Text>
    </Section>
  )
}

export default Footer
