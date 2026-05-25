import React, { useState } from 'react';
import {
  hubspot,
  Text,
  Flex,
  LoadingSpinner,
  Alert,
  Button,
  Link
} from '@hubspot/ui-extensions';
import {
  APP_ORIGIN,
  getCompanySearchContext,
  researchCompany,
  researchSummary,
  SETTINGS_HINT
} from './lib/companyResearch';

hubspot.extend(({ context, actions }) => (
  <CompanyResearchSidebar context={context} addAlert={actions.addAlert} />
));

function CompanyResearchSidebar({ context, addAlert }) {
  const props = context?.crm?.object?.properties || {};
  const { query, label } = getCompanySearchContext(props);
  const [state, setState] = useState({
    loading: false,
    researched: false,
    data: null,
    error: null
  });

  async function handleResearch() {
    if (!query) {
      setState({
        loading: false,
        researched: false,
        data: null,
        error: 'Add a company domain or name first.'
      });
      return;
    }

    setState({ loading: true, researched: false, data: null, error: null });

    try {
      const result = await researchCompany(props, context?.portal?.id);

      if (!result.ok) {
        setState({
          loading: false,
          researched: false,
          data: null,
          error: result.message
        });
        return;
      }

      setState({
        loading: false,
        researched: true,
        data: result,
        error: null
      });

      addAlert({
        type: 'success',
        title: 'Hi Energy research complete',
        message: researchSummary(result)
      });
    } catch (err) {
      setState({
        loading: false,
        researched: false,
        data: null,
        error: String(err.message || err)
      });
    }
  }

  const topRows = (state.data?.sections || [])
    .flatMap((section) => section.rows || [])
    .slice(0, 3);

  return (
    <Flex direction="column" gap="sm">
      <Text variant="microcopy">{label}</Text>

      <Button
        variant="primary"
        onClick={handleResearch}
        disabled={state.loading || !query}
      >
        Research company
      </Button>

      {state.loading ? <LoadingSpinner label="Researching in Hi Energy AI…" /> : null}

      {state.error ? (
        <>
          <Alert title="Hi Energy AI" variant="warning">
            {state.error}
          </Alert>
          <Text variant="microcopy">{SETTINGS_HINT}</Text>
        </>
      ) : null}

      {state.researched && !state.error ? (
        <>
          {topRows.length === 0 ? (
            <Text>No Hi Energy matches for this company.</Text>
          ) : (
            topRows.map((row) => (
              <Flex key={row.id || row.label} direction="column" gap="xs">
                <Link href={row.adminUrl || APP_ORIGIN}>{row.label}</Link>
                {row.subtitle ? <Text variant="microcopy">{row.subtitle}</Text> : null}
              </Flex>
            ))
          )}
          <Button href={{ url: APP_ORIGIN, external: true }} variant="secondary">
            Open Hi Energy AI
          </Button>
        </>
      ) : null}
    </Flex>
  );
}
