import React from 'react';
import { Text, Link, Flex } from '@hubspot/ui-extensions';
import { APP_ORIGIN, formatSectionTitle } from './researchUtils';

export function ResearchSections({ sections, emptyMessage }) {
  if (!sections.length) {
    return <Text>{emptyMessage}</Text>;
  }

  return sections.map((section) => (
    <SectionBlock key={section.type} section={section} />
  ));
}

export function SectionBlock({ section }) {
  return (
    <Flex direction="column" gap="xs">
      <Text format={{ fontWeight: 'bold' }}>{formatSectionTitle(section)}</Text>
      {section.rows.map((row) => (
        <Flex key={row.id || row.label} direction="column" gap="xs">
          <Link href={row.adminUrl || APP_ORIGIN}>{row.label}</Link>
          {row.subtitle ? <Text variant="microcopy">{row.subtitle}</Text> : null}
        </Flex>
      ))}
    </Flex>
  );
}
