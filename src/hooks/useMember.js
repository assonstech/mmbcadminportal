import { useState, useEffect } from 'react';
import { getMembers, getMemberTypes, getNrcTypes, getTownshipsByCode } from '../controllers/MemberController';

export function useMembers() {
  const [loading ,setLoading] = useState(false)
  const [rows, setRows] = useState([]);
  const [memberTypes, setMemberTypes] = useState([]);
  const [nrcTypes, setNrcTypes] = useState([]);
  const [nrcTownships, setNrcTownships] = useState([]);
  
  const fetchMembersData = async () => {
    setLoading(true)
    try {
      const [members, types, nrcs] = await Promise.all([
        getMembers(),
        getMemberTypes(),
        getNrcTypes()
      ]);
      setRows(members);
      setMemberTypes(types);
      setNrcTypes(nrcs);
    } catch (err) {
      console.error(err);
    }finally{
      setLoading(false)
    }
  };

  const fetchTownships = async (code) => {
    try {
      const townships = await getTownshipsByCode(code);
      setNrcTownships(townships.sort((a, b) => a.shortEn.localeCompare(b.shortEn)));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { fetchMembersData(); }, []);

  return { rows, setRows, memberTypes, nrcTypes, nrcTownships, fetchTownships,loading };
}
