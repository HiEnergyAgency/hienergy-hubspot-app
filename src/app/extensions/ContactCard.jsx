import React, { useEffect, useState } from 'react';
import {
  hubspot,
  Text,
  Link,
  Flex,
  Divider,
  LoadingSpinner,
  Alert,
  Button
} from '@hubspot/ui-extensions';

const APP_ORIGIN = 'https://app.hienergy.ai';

hubspot.extend(({ context }) => <ContactCard context={context} />);

function ContactCard({ context }) {
  const props = context?.crm?.object?.properties || {};
  const email = props.email || '';
  const domain = domainFromEmail(email);
  const query = domain || props.company || [props.firstname, props.lastname].filter(Boolean).join(' ');

  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!query) {
        setState({
          loading: false,
          data: null,
          error: 'Add an email or company to search Hi Energy AI.'
        });
        return;
      }

      setState({ loading: true, data: null, error: null });

      try {
        const response = await hubspot.serverless('hienergySearch', {
          parameters: {
            query: domain || query,
            types: 'advertisers,deals,contacts',
            perTypeLimit: 5
          }
        });
        const body = response?.body || response;

        if (cancelled) return;
        if (!body?.ok) {
          setState({
            loading: false,
            data: null,
            error: body?.message || 'Hi Energy request failed.'
          });
          return;
        }
        setState({ loading: false, data: body, error: null });
      } catch (err) {
        if (!cancelled) {
          setState({ loading: false, data: null, error: String(err.message || err) });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [query, domain, email]);

  if (state.loading) {
    return <LoadingSpinner label="Searching Hi Energy AI…" />;
  }

  if (state.error) {
    return (
      <Flex direction="column" gap="md">
        <Alert title="Hi Energy AI" variant="warning">
          {state.error}
        </Alert>
        <Button href={`${APP_ORIGIN}/settings`}>Connect Hi Energy AI</Button>
      </Flex>
    );
  }

  const sections = state.data?.sections || [];

  return (
    <Flex direction="column" gap="sm">
      <Text variant="microcopy">
        {email ? `Email domain: ${domain || '—'}` : `Search: ${query}`}
      </Text>
      {sections.length === 0 ? (
        <Text>No Hi Energy matches for this contact.</Text>
      ) : (
        sections.map((section) => (
          <SectionBlock key={section.type} section={section} />
        ))
      )}
      <Divider />
      <Button href={APP_ORIGIN}>Open Hi Energy AI</Button>
    </Flex>
  );
}

function SectionBlock({ section }) {
  const title =
    section.type.charAt(0).toUpperCase() +
    section.type.slice(1).replace(/_/g, ' ') +
    (section.total ? ` · ${section.total}` : '');

  return (
    <Flex direction="column" gap="xs">
      <Text format={{ fontWeight: 'bold' }}>{title}</Text>
      {section.rows.map((row) => (
        <Flex key={row.id || row.label} direction="column" gap="xs">
          <Link href={row.adminUrl || APP_ORIGIN}>{row.label}</Link>
          {row.subtitle ? <Text variant="microcopy">{row.subtitle}</Text> : null}
        </Flex>
      ))}
    </Flex>
  );
}

function domainFromEmail(email) {
  const m = String(email || '').match(/@([^@\s]+)/);
  return m ? m[1].toLowerCase() : '';
}
