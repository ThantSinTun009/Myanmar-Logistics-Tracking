'use client';
import dynamic from 'next/dynamic';
import {useEffect,useState} from 'react';
import {getDemoState} from '../../../../lib/demo'

const TrackingMap = dynamic(() => import('../../../../components/Map'), {
  ssr: false,
  loading: () => <div className="map"><div style={{display:'grid',placeItems:'center',height:'100%',color:'#5d6b82'}}>Loading map...</div></div>
})

export default function Detail({params}:{params:{id:string}}){
  const [s,setS]=useState<any>()
  const [events,setEvents]=useState<any[]>([])
  useEffect(()=>{
    const load=()=>{
      const state=getDemoState()
      const shipment=state.shipments.find((x:any)=>x.id===params.id)
      setS(shipment?{...shipment,routes:state.routes.find((r:any)=>r.id===shipment.route_id)}:null)
      setEvents(state.events.filter((e:any)=>e.shipment_id===params.id).sort((a:any,b:any)=>a.created_at.localeCompare(b.created_at)))
    }
    load()
    window.addEventListener('logistics-demo-update',load)
    return()=>window.removeEventListener('logistics-demo-update',load)
  },[params.id])
  if(!s)return <p>Loading...</p>
  return <>
    <h1>{s.tracking_number}</h1>
    <div className="grid grid2">
      <div className="card">
        <h2>Shipment</h2>
        <p><b>Cargo:</b> {s.cargo_description}</p>
        <p><b>Route:</b> {s.origin} -&gt; {s.destination}</p>
        <p><b>Status:</b> <span className="badge">{s.status}</span></p>
        <TrackingMap lat={s.latitude} lng={s.longitude}/>
      </div>
      <div className="card">
        <h2>Timeline</h2>
        <div className="timeline">{events.map(e=><div className="event" key={e.id}><b>{e.status}</b><div className="muted">{new Date(e.created_at).toLocaleString()}</div><div>{e.description}</div><small>{e.latitude?.toFixed?.(4)}, {e.longitude?.toFixed?.(4)}</small></div>)}</div>
      </div>
    </div>
  </>
}
