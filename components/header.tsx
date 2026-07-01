import { LogIn, Store } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { features } from "@/config/features";

interface HeaderProps {
	name: string;
	avatarUrl?: string | null;
}

export function Header({ name, avatarUrl }: HeaderProps) {
	return (
		<header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-lg">
			<div className="container flex h-14 items-center justify-between">
				<nav className="flex items-center gap-5">
					<Link
						href="/"
						className="flex items-center gap-2 text-sm font-medium text-foreground transition-opacity hover:opacity-70"
					>
						{avatarUrl ? (
							<Image
								src={avatarUrl}
								alt={name}
								width={24}
								height={24}
								priority
								className="size-6 rounded-full object-cover"
							/>
						) : (
							<Store className="size-4" />
						)}
						{name}
					</Link>

					{features.bookings && (
						<Link
							href="/book"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Book
						</Link>
					)}

					{features.blog && (
						<Link
							href="/blog"
							className="text-sm text-muted-foreground transition-colors hover:text-foreground"
						>
							Blog
						</Link>
					)}
				</nav>

				{features.auth && (
					<a
						href="https://crevio.co/users/login"
						target="_blank"
						rel="noopener noreferrer"
						className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						<LogIn className="size-3.5" />
						<span className="hidden sm:inline">Log in</span>
					</a>
				)}
			</div>
		</header>
	);
}
