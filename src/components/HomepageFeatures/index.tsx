import type { ReactNode } from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'What this guide is NOT',
    description: (
      <>
        Not a hello world docker guide. Not a tutorial on port forwarding, networks, or creating smaller images using multi-stage builds.
      </>
    ),
  },
  {
    title: 'What this guide IS',
    description: (
      <>
        Understand the mechanics behind the magic trick 🐇🎩. Debug production bugs, understand constraints, and learn about layers and bridges.
      </>
    ),
  },
  {
    title: 'Why do I need to know this',
    description: (
      <>
        Abstractions are good until they break. When they do, you need to know the plumbing to fix it not just google error messages without context without becoming a kernel developer.
      </>
    ),
  },
  {
    title: 'Prerequisites',
    description: (
      <>
        You should be comfortable with the Linux command line, have root access to the machine and know the basics of running Docker containers.
      </>
    ),
  },
];

function Feature({ title, description }: FeatureItem) {
  return (
    <div className={clsx('col col--6')}>
      <div className="text--center padding-horiz--md" style={{ border: '1px solid var(--ifm-color-emphasis-200)', borderRadius: '8px', padding: '20px', margin: '10px', height: '100%' }}>
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
