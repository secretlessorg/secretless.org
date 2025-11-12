import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <div className={styles.heroContent}>
          <Heading as="h1" className={clsx("hero__title", styles.heroTitle)}>
            Eliminate Long-Lived Secrets
          </Heading>
          <p className={clsx("hero__subtitle", styles.heroSubtitle)}>
            Secure your infrastructure with <strong>secretless authentication</strong> using OIDC,
            just-in-time credentials, and modern authentication workflows.
          </p>
          <p className={styles.heroDescription}>
            Stop storing API keys, tokens, and credentials. Start using temporary,
            scoped authentication that expires automatically.
          </p>
          <div className={styles.buttons}>
            <Link
              className="button button--secondary button--lg"
              to="/docs/intro">
              Get Started
            </Link>
            <Link
              className={clsx("button button--outline button--lg", styles.buttonOutline)}
              to="/docs/guides">
              View Guides
            </Link>
          </div>
          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statNumber}>5+</div>
              <div className={styles.statLabel}>Cloud Providers</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>10+</div>
              <div className={styles.statLabel}>Integration Guides</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statNumber}>0</div>
              <div className={styles.statLabel}>Secrets Stored</div>
            </div>
          </div>
        </div>
      </div>
      <div className={styles.heroWave}>
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path
            d="M0 0L60 10C120 20 240 40 360 46.7C480 53 600 47 720 43.3C840 40 960 40 1080 46.7C1200 53 1320 67 1380 73.3L1440 80V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0V0Z"
            fill="var(--ifm-background-color)"
          />
        </svg>
      </div>
    </header>
  );
}

function SecurityBanner(): ReactNode {
  return (
    <section className={styles.securityBanner}>
      <div className="container">
        <div className={styles.bannerContent}>
          <div className={styles.bannerIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <path d="M24 4L8 12V23C8 32 13 39 24 46C35 39 40 32 40 23V12L24 4Z"
                    fill="url(#shield-grad)" stroke="currentColor" strokeWidth="2"/>
              <path d="M18 24L22 28L30 20" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="shield-grad" x1="24" y1="4" x2="24" y2="46">
                  <stop offset="0%" stopColor="#10B981"/>
                  <stop offset="100%" stopColor="#059669"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className={styles.bannerText}>
            <h3>No More Credential Leaks</h3>
            <p>
              Every stored secret is a security risk. Secretless authentication eliminates
              the need to store credentials, reducing your attack surface and compliance burden.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Secure Authentication Without Secrets"
      description="Learn how to implement secretless authentication workflows using OIDC connections across AWS, GCP, Azure, Kubernetes, and CI/CD platforms. Stop storing credentials, start using temporary authentication.">
      <HomepageHeader />
      <main>
        <SecurityBanner />
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
