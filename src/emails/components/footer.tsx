/** @jsxImportSource react */

import {
  Link,
  Section,
  Text,
} from '@react-email/components'

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

const defaultSocialLinks: SocialLink[] = [
  {
    href: 'https://twitter.com/yourcompany',
    label: 'Twitter',
    icon: (
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
  },
  {
    href: 'https://facebook.com/yourcompany',
    label: 'Facebook',
    icon: (
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
  },
]

const Footer = ({
  companyName = 'The Company',
  socialLinks = defaultSocialLinks,
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
