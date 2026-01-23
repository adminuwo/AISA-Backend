import React, { useState } from 'react';
import { AlertCircle, Server, ShieldAlert, ToggleLeft, ToggleRight, Settings2 } from 'lucide-react';

const PlatformSettings = () => {
    const [maintenance, setMaintenance] = useState(false);
    const [killSwitch, setKillSwitch] = useState(false);

    return (
        <div className="space-y-8">
            <h2 className="text-xl font-bold text-maintext">Platform Settings & Safety</h2>

            {/* General Config */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold text-maintext mb-4 flex items-center gap-2"><Settings2 className="w-5 h-5" /> General Configuration</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-maintext mb-2">Platform Name</label>
                        <input type="text" defaultValue="A-Series" className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm outline-none text-maintext" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-maintext mb-2">Contact Email</label>
                        <input type="text" defaultValue="support@a-series.in" className="w-full bg-secondary border border-border rounded-lg px-4 py-2 text-sm outline-none text-maintext" />
                    </div>
                </div>
            </div>

            {/* Safety & Emergency */}
            <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
                <h3 className="font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2"><ShieldAlert className="w-5 h-5" /> Safety & Emergency Controls</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-border">
                        <div>
                            <p className="font-bold text-maintext">Maintenance Mode</p>
                            <p className="text-sm text-subtext">Disable user access for system upgrades.</p>
                        </div>
                        <button onClick={() => setMaintenance(!maintenance)} className={`text-2xl ${maintenance ? 'text-green-500' : 'text-subtext'}`}>
                            {maintenance ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                        </button>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-card rounded-lg border border-red-500/20">
                        <div>
                            <p className="font-bold text-red-600 dark:text-red-400">Global Kill-Switch</p>
                            <p className="text-sm text-subtext">Immediately disable ALL AI Agent inference APIs.</p>
                        </div>
                        <button onClick={() => setKillSwitch(!killSwitch)} className={`text-2xl ${killSwitch ? 'text-red-600 dark:text-red-400' : 'text-subtext'}`}>
                            {killSwitch ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                        </button>
                    </div>
                </div>
            </div>

            {/* API Controls */}
            <div className="bg-card border border-border rounded-xl p-6">
                <h3 className="font-bold text-maintext mb-4 flex items-center gap-2"><Server className="w-5 h-5" /> API Rate Limits</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm text-subtext">Global Requests Per Minute</label>
                        <input type="range" className="w-full mt-2 accent-primary" />
                        <div className="flex justify-between text-xs text-subtext mt-1">
                            <span>1k</span>
                            <span>10k</span>
                            <span>100k</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PlatformSettings;
