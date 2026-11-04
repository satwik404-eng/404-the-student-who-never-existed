// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';
vi.mock('../src/client',()=>({supabase:{auth:{}},supportedIdentity:()=>true,browserSlot:()=>''}));
import { IdentityGate, useIdentity } from '../src/Auth';
import { useGame } from '../src/store';
import type { GameState } from '../shared/types';
afterEach(cleanup);
describe('account switching boundary',()=>{
  it('hides a previous account’s state immediately after an auth-user switch',()=>{
    useIdentity.setState({ready:true,user:{id:'bob'} as User});
    useGame.setState({loading:false,error:'',state:{id:'alice',onboarded:true} as GameState});
    render(<MemoryRouter><IdentityGate requireName={false}><p>private investigation</p></IdentityGate></MemoryRouter>);
    expect(screen.queryByText('private investigation')).toBeNull();
    expect(screen.getByRole('status')).toBeTruthy();
  });
  it('renders state only when it belongs to the active account',()=>{
    useIdentity.setState({ready:true,user:{id:'bob'} as User});
    useGame.setState({loading:false,error:'',state:{id:'bob',onboarded:true} as GameState});
    render(<MemoryRouter><IdentityGate><p>own investigation</p></IdentityGate></MemoryRouter>);
    expect(screen.getByText('own investigation')).toBeTruthy();
  });
});
