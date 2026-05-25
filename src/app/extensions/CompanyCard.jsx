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

hubspot.extend(({ context }) => <CompanyCard context={context} />);

function CompanyCard({ context }) {
  const props = context?.crm?.object?.properties || {};
  const domain = domainFromWebsite(props.domain || props.website);
  const query = domain || props.name || '';

  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!query) {
        setState({
          loading: false,
          data: null,
          error: 'Add a company domain or name to search Hi Energy AI.'
        });
        return;
      }

      setState({ loading: true, data: null, error: null });

      try {
        const fn = domain ? 'hienergyAdvertiserByDomain' : 'hienergySearch';
        const params = domain ? { domain } : { query, types: 'advertisers,deals,contacts' };
        const response = await hubspot.serverless(fn, { parameters: params });
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

        if (body.advertisers) {
          setState({
            loading: false,
            data: {
              sections: [
                {
                  type: 'advertisers',
                  total: body.advertisers.length,
                  rows: body.advertisers
                }
              ]
            },
            error: null
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
  }, [query, domain]);

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
        {domain ? `Domain: ${domain}` : `Search: ${query}`}
      </Text>
      {sections.length === 0 ? (
        <Text>No Hi Energy matches for this company.</Text>
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

function domainFromWebsite(website) {
  let raw = String(website || '').trim();
  if (!raw) return '';
  try {
    if (!/^https?:\/\//i.test(raw)) raw = 'https://' + raw;
    return new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return raw.replace(/^www\./, '').split('/')[0].toLowerCase();
  }
}
