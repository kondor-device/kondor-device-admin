import styled from 'styled-components'

export const Shell = styled.div`
  height: 100%;
  overflow: auto;
  padding: 24px;
  box-sizing: border-box;
  font: inherit;
  color: inherit;
  h1 {
    font-size: 25px;
    margin: 0 0 8px;
  }
  h2 {
    font-size: 19px;
    margin: 0 0 12px;
  }
  p {
    line-height: 1.5;
  }
  button,
  input,
  select,
  textarea {
    font: inherit;
    color: inherit;
  }
  input,
  select,
  textarea {
    box-sizing: border-box;
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #9298a3;
    border-radius: 6px;
    background: transparent;
  }
  option {
    color: #172033;
    background: #fff;
  }
  textarea {
    resize: vertical;
    line-height: 1.5;
  }
  label {
    display: grid;
    gap: 8px;
    font-size: 14px;
    font-weight: 600;
  }
  button {
    cursor: pointer;
    min-height: 40px;
    padding: 8px 12px;
    background: transparent;
    border: 1px solid #9298a3;
    border-radius: 6px;
    font-weight: 600;
  }
  button:disabled {
    cursor: default;
    opacity: 0.5;
  }
  button:focus-visible,
  input:focus-visible,
  select:focus-visible,
  textarea:focus-visible {
    outline: 3px solid #2563eb;
    outline-offset: 2px;
  }
  button[data-primary='true'] {
    background: #1d4ed8;
    color: #fff;
    border-color: #1d4ed8;
  }
  button[aria-pressed='true'] {
    background: #1d4ed8;
    color: #fff;
    border-color: #1d4ed8;
  }
  small {
    font-size: 12px;
    line-height: 1.5;
  }
  pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font: inherit;
    line-height: 1.55;
    margin: 8px 0;
  }
  [role='alert'] {
    color: #9f1239;
    background: #fff1f2;
    border: 1px solid #fda4af;
    padding: 12px;
    border-radius: 6px;
    margin: 12px 0;
  }
  [role='status'] {
    margin: 12px 0;
    line-height: 1.5;
  }
  @media (max-width: 700px) {
    padding: 14px;
  }
`
export const Filters = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 1fr) minmax(180px, 1fr) auto;
  gap: 12px;
  align-items: end;
  margin: 20px 0;
  @media (max-width: 700px) {
    grid-template-columns: 1fr;
  }
`
export const Buttons = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin: 12px 0;
`
export const Columns = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 1fr) minmax(340px, 1.25fr);
  gap: 24px;
  align-items: start;
  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
  }
`
export const Panel = styled.section`
  border: 1px solid #9298a3;
  border-radius: 8px;
  padding: 18px;
  min-width: 0;
  overflow-wrap: anywhere;
  label {
    margin-top: 18px;
  }
  dl {
    font-size: 14px;
    line-height: 1.6;
  }
  dt {
    font-weight: 600;
  }
  dd {
    margin: 0 0 6px;
  }
  details {
    border-top: 1px solid #9298a3;
    padding-top: 12px;
    margin-top: 16px;
  }
  summary {
    cursor: pointer;
    font-weight: 600;
    min-height: 32px;
  }
`
export const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 10px;
  li button {
    width: 100%;
    text-align: left;
    padding: 14px;
    display: grid;
    gap: 8px;
    border-radius: 8px;
    font-weight: 400;
  }
  li button[aria-current='true'] {
    border: 2px solid #2563eb;
  }
  strong {
    font-weight: 700;
  }
  time {
    font-size: 12px;
  }
  p {
    margin: 0;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  small {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: 8px;
  }
`
