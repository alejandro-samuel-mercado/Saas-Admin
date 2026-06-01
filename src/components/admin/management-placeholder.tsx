import { Construction } from "lucide-react"

interface PlaceholderProps {
    title: string
    description?: string
}

export function ManagementPlaceholder({ title, description = "Módulo en desarrollo." }: PlaceholderProps) {
    return (
        <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] text-center p-8">
            <div className="bg-yellow-100 dark:bg-yellow-900/20 p-6 rounded-full mb-6">
                <Construction className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-2">{title}</h2>
            <p className="text-muted-foreground max-w-lg mb-8">{description}</p>
        </div>
    )
}
