import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'OIDC Authentication',
    Svg: require('@site/static/img/feature-oidc.svg').default,
    description: (
      <>
        Use OpenID Connect (OIDC) to establish trust between services without
        storing long-lived credentials. Get temporary tokens that automatically expire.
      </>
    ),
  },
  {
    title: 'Multi-Cloud Support',
    Svg: require('@site/static/img/feature-cloud.svg').default,
    description: (
      <>
        Works across AWS, GCP, Azure, Kubernetes, and Cloudflare. Integrate CI/CD
        platforms like GitHub Actions, GitLab CI, and Buildkite with your cloud providers.
      </>
    ),
  },
  {
    title: 'Zero Trust Security',
    Svg: require('@site/static/img/feature-security.svg').default,
    description: (
      <>
        Eliminate credential leaks, reduce attack surface, and improve compliance.
        Every authentication is verified, temporary, and scoped to specific permissions.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
