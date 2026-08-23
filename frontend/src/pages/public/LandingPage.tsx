import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/auth.store';
import { FileText, Shield, Zap, Mail, Send, CheckCircle2, Clock } from 'lucide-react';
import { motion } from 'framer-motion';
import { uiActions } from '../../utils/uiActions';

export const LandingPage = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
	const [contactName, setContactName] = useState('');
	const [contactEmail, setContactEmail] = useState('');
	const [contactSubject, setContactSubject] = useState('');
	const [contactMessage, setContactMessage] = useState('');
	const [contactSuccess, setContactSuccess] = useState(false);

	if (isAuthenticated) {
		return <Navigate to="/dashboard" replace />;
	}

	const handleContactSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
			uiActions.error('Please fill in all required fields.');
			return;
		}

		const mailtoSubject = encodeURIComponent(contactSubject || `Inquiry from ${contactName}`);
		const mailtoBody = encodeURIComponent(`Name: ${contactName}\nEmail: ${contactEmail}\n\nMessage:\n${contactMessage}`);

		window.location.href = `mailto:muhammadsajidrajput20@gmail.com?subject=${mailtoSubject}&body=${mailtoBody}`;
		setContactSuccess(true);
		uiActions.success('Opening email client to send your message.');
	};

	return (
		<div id="home" className="min-h-screen bg-white text-on-surface overflow-x-hidden relative font-sans">
			<div
				className="absolute top-32 left-1/2 -translate-x-1/2 w-full max-w-4xl h-105 pointer-events-none z-0 bg-grid-pattern rounded-3xl"
				style={{
					maskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 20%, transparent 100%)',
					WebkitMaskImage: 'radial-gradient(ellipse 65% 65% at 50% 50%, black 20%, transparent 100%)'
				}}
			/>
			<header className="relative z-10 flex items-center justify-between px-6 py-6 md:px-12 max-w-7xl mx-auto">
				<div className="flex items-center gap-3">
					<div className="w-9 h-9 flex items-center justify-center rounded-xl shadow-xs" style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}>
						<FileText className="h-5 w-5" />
					</div>
					<span className="text-xl font-extrabold text-on-surface tracking-tight">NotesHub</span>
				</div>

				<nav className="hidden md:flex items-center gap-8 text-sm font-bold text-on-surface-variant">
					<a href="#home" className="hover:text-primary transition-colors">Home</a>
					<a href="#features" className="hover:text-primary transition-colors">Features</a>
					<a href="#contact" className="hover:text-primary transition-colors">Contact</a>
				</nav>

				<div className="flex items-center gap-4">
					<Link to="/login">
						<button className="h-9 px-4 font-bold text-on-surface-variant hover:text-primary transition-colors text-sm hidden sm:block">
							Log in
						</button>
					</Link>
					<Link to="/register">
						<button
							className="h-10 px-6 rounded-full font-bold text-sm transition-all flex items-center justify-center shadow-md active:scale-95"
							style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
							onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')}
							onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
						>
							Get Started
						</button>
					</Link>
				</div>
			</header>

			<main className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-32 text-center">
				<motion.h1
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
					className="text-[52px] md:text-[80px] font-extrabold text-on-surface tracking-tight mb-6 leading-[1.08]"
				>
					Write, plan, share.<br />
					<span className="text-primary">With AI at your side.</span>
				</motion.h1>

				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
					className="text-lg md:text-xl text-on-surface-variant font-medium max-w-2xl mx-auto mb-10 leading-relaxed"
				>
					One AI agent that connects to your notes and ideas to collect everything that matters and deliver a clear workspace.
				</motion.p>

				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
					className="flex items-center justify-center gap-3"
				>
					<Link to="/register">
						<button
							className="h-14 px-8 rounded-full font-extrabold text-[16px] transition-all duration-300 shadow-xl flex items-center gap-2 active:scale-95"
							style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
							onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')}
							onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
						>
							Get NotesHub free
						</button>
					</Link>
				</motion.div>

				<motion.div
					initial={{ opacity: 0, y: 40, scale: 0.98 }}
					animate={{ opacity: 1, y: 0, scale: 1 }}
					transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
					className="mt-16 sm:mt-24 relative max-w-6xl mx-auto p-2.5 rounded-4xl bg-white border border-outline-variant shadow-2xl"
				>
					<div className="relative rounded-2xl w-full overflow-hidden bg-white">
						<img
							src="/landingpageappimage.png"
							alt="NotesHub Application Interface"
							className="w-full h-full object-cover rounded-2xl"
						/>
					</div>
				</motion.div>

				<div id="features" className="grid md:grid-cols-3 gap-8 mt-32 text-left">
					{[
						{ icon: Shield, title: "Secure by design", desc: "Strict validation, short-lived tokens, and HTTP-only cookies keep your ideas and sessions entirely safe." },
						{ icon: FileText, title: "Frictionless editing", desc: "Experience a clean, distraction-free markdown editing environment natively integrated with rich-text capabilities." },
						{ icon: Zap, title: "AI retrieval", desc: "Search semantically and converse with your documents directly using the built-in Gemini vector pipeline." }
					].map((feat, i) => (
						<motion.div
							key={feat.title}
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true, margin: "-50px" }}
							transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 + (i * 0.1) }}
							className="p-8 rounded-3xl bg-white/90 backdrop-blur-md border border-outline-variant shadow-md hover:-translate-y-1 transition-all duration-300"
						>
							<div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-6 shadow-xs" style={{ backgroundColor: 'var(--color-primary-tint)', color: 'var(--color-primary)' }}>
								<feat.icon className="h-6 w-6" />
							</div>
							<h3 className="text-xl font-extrabold mb-3 text-on-surface">{feat.title}</h3>
							<p className="text-on-surface-variant font-medium text-[15px] leading-relaxed">
								{feat.desc}
							</p>
						</motion.div>
					))}
				</div>

				<div id="contact" className="mt-36 pt-12 text-left">
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
						className="max-w-4xl mx-auto bg-white rounded-4xl border border-outline-variant shadow-xl p-8 sm:p-12"
					>
						<div className="grid grid-cols-1 md:grid-cols-5 gap-10">
							<div className="md:col-span-2 space-y-6 flex flex-col justify-between">
								<div className="space-y-4">
									<div className="w-12 h-12 rounded-2xl bg-primary-tint flex items-center justify-center text-primary shadow-xs">
										<Mail className="w-6 h-6" />
									</div>
									<h2 className="text-2xl font-extrabold text-on-surface tracking-tight leading-tight">Get in touch</h2>
									<p className="text-sm font-medium text-on-surface-variant leading-relaxed">
										Have questions or feedback? Send us a message and our team will get back to you shortly.
									</p>
								</div>

								<div className="space-y-4 pt-4 border-t border-outline-variant/60">
									<div className="flex items-start gap-3 text-xs font-bold text-on-surface-variant">
										<Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
										<div>
											<p className="text-on-surface font-extrabold">Direct Support Email</p>
											<a href="mailto:muhammadsajidrajput20@gmail.com" className="text-primary hover:underline font-semibold break-all">
												muhammadsajidrajput20@gmail.com
											</a>
										</div>
									</div>

									<div className="flex items-center gap-3 text-xs font-bold text-on-surface-variant">
										<Clock className="w-4 h-4 text-primary shrink-0" />
										<div>
											<p className="text-on-surface font-extrabold">Response Time</p>
											<p className="font-semibold text-on-surface-variant">Under 24 hours</p>
										</div>
									</div>
								</div>
							</div>

							<div className="md:col-span-3">
								{contactSuccess ? (
									<div className="h-full flex flex-col items-center justify-center text-center space-y-4 py-8 animate-in fade-in duration-300">
										<div className="w-14 h-14 bg-primary-tint text-primary rounded-full flex items-center justify-center shadow-xs">
											<CheckCircle2 className="w-8 h-8" />
										</div>
										<h3 className="text-xl font-extrabold text-on-surface">Message Ready!</h3>
										<p className="text-sm font-medium text-on-surface-variant max-w-sm">
											Your email client has been opened with your pre-filled inquiry for <strong className="text-primary">muhammadsajidrajput20@gmail.com</strong>.
										</p>
										<button
											onClick={() => setContactSuccess(false)}
											className="mt-2 text-xs font-extrabold text-primary hover:underline"
										>
											Send another message
										</button>
									</div>
								) : (
									<form onSubmit={handleContactSubmit} className="space-y-4">
										<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
											<div className="space-y-1.5">
												<label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">Your Name *</label>
												<input
													type="text"
													required
													value={contactName}
													onChange={(e) => setContactName(e.target.value)}
													placeholder="John Doe"
													className="w-full bg-background border border-outline-variant rounded-xl px-4 py-3 text-xs font-semibold placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs"
												/>
											</div>
											<div className="space-y-1.5">
												<label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">Your Email *</label>
												<input
													type="email"
													required
													value={contactEmail}
													onChange={(e) => setContactEmail(e.target.value)}
													placeholder="name@example.com"
													className="w-full bg-background border border-outline-variant rounded-xl px-4 py-3 text-xs font-semibold placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs"
												/>
											</div>
										</div>

										<div className="space-y-1.5">
											<label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">Subject</label>
											<input
												type="text"
												value={contactSubject}
												onChange={(e) => setContactSubject(e.target.value)}
												placeholder="How can we help you?"
												className="w-full bg-background border border-outline-variant rounded-xl px-4 py-3 text-xs font-semibold placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs"
											/>
										</div>

										<div className="space-y-1.5">
											<label className="text-xs font-extrabold text-on-surface uppercase tracking-wider">Message *</label>
											<textarea
												required
												rows={4}
												value={contactMessage}
												onChange={(e) => setContactMessage(e.target.value)}
												placeholder="Type your message here..."
												className="w-full bg-background border border-outline-variant rounded-xl p-4 text-xs font-semibold placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary focus:bg-white transition-all shadow-xs resize-none"
											/>
										</div>

										<button
											type="submit"
											className="w-full h-12 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all active:scale-98 shadow-md"
											style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-on-semantic)' }}
											onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)')}
											onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--color-primary)')}
										>
											<Send className="w-4 h-4" /> Send Message
										</button>
									</form>
								)}
							</div>
						</div>
					</motion.div>
				</div>
			</main>
		</div>
	);
};