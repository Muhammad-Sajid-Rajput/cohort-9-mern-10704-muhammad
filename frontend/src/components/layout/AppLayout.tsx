import { Outlet, Link, useLocation } from 'react-router-dom';
import { FileText, Plus, LogOut, Settings, LayoutGrid } from 'lucide-react';
import { Button } from '../ui/Button';

export const AppLayout = () => {
	const location = useLocation();

	const navItems = [
		{ label: 'All Notes', icon: LayoutGrid, path: '/dashboard' },
	];

	return (
		<div className="flex h-screen bg-background text-on-surface font-medium selection:bg-black selection:text-white">
			<aside className="w-60 bg-white flex flex-col justify-between py-10 px-6 z-50 border-r border-outline-variant">
				<div className="space-y-10 text-left">
					<div className="px-2 flex items-center gap-3.5">
						<div className="w-9 h-9 flex items-center justify-center rounded-lg shadow-sm" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}>
							<FileText className="h-4.5 w-4.5" />
						</div>
						<h1 className="text-xl font-extrabold tracking-tight text-on-surface leading-none">NotesHub</h1>
					</div>

					<div className="px-0">
						<Link to="/notes/new">
							<Button className="w-full flex items-center justify-center gap-2 rounded-xl h-10 transition-colors shadow-sm font-extrabold text-xs uppercase tracking-wider" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}>
								<Plus className="h-4 w-4" />
								<span className="font-extrabold text-xs uppercase tracking-wider">New Note</span>
							</Button>
						</Link>
					</div>

					<nav className="space-y-1.5">
						{navItems.map((item) => {
							const isActive = location.pathname === item.path;
							return (
								<Link
									key={item.label}
									to={item.path}
									className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all ${isActive
										? 'bg-primary-tint text-primary font-bold border border-primary/20 shadow-sm'
										: 'text-on-surface-variant hover:text-primary font-semibold'
										}`}
								>
									<item.icon className="h-4.5 w-4.5" />
									<span className="text-[14px]">{item.label}</span>
								</Link>
							);
						})}
					</nav>
				</div>

				<div className="space-y-6 text-left">
					<div className="flex flex-col gap-1 text-left">
						<Link to="/settings" className={`flex items-center gap-3.5 py-2.5 px-4 rounded-xl font-semibold transition-colors ${location.pathname === '/settings'
								? 'bg-primary-tint text-primary font-bold border border-primary/20 shadow-sm'
								: 'text-on-surface-variant hover:text-primary'
							}`}>
							<Settings className="h-4.5 w-4.5" />
							<span className="text-[14px]">Settings</span>
						</Link>
					</div>

					<div className="px-2 py-4 border-t border-outline-variant pt-6">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-3 overflow-hidden">
								<div className="w-8 h-8 rounded-full bg-primary shrink-0 flex items-center justify-center text-white font-bold text-xs shadow-xs">
									U
								</div>
								<div className="truncate text-[13px] font-bold text-on-surface">
									User
								</div>
							</div>
							<button aria-label="logout" className="p-2 text-on-surface-variant hover:text-red-500 transition-colors">
								<LogOut className="h-4 w-4" />
							</button>
						</div>
					</div>
				</div>
			</aside>

			<main className="flex-1 overflow-y-auto bg-surface p-8 sm:p-10 relative">
				<div className="max-w-275 mx-auto w-full">
					<Outlet />
				</div>
			</main>
		</div>
	);
};
