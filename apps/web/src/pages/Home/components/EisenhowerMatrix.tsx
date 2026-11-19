import { useMemo } from 'react';
import {
	useReactTable,
	getCoreRowModel,
	flexRender,
	createColumnHelper,
} from '@tanstack/react-table';
import { DoTask, ScheduleTask, DelegateTask, DeleteTask } from '../mockData';
import { ThemeConfig } from '@zenner/core/theme/themeConfig';

interface EisenhowerMatrixProps {
	matrix: {
		do: DoTask[];
		schedule: ScheduleTask[];
		delegate: DelegateTask[];
		delete: DeleteTask[];
	};
	onToggleDoTask: (taskId: string) => void;
	t: (key: string) => string;
	themeConfig: ThemeConfig;
}

export function EisenhowerMatrix({
	matrix,
	onToggleDoTask,
	t,
	themeConfig,
}: EisenhowerMatrixProps) {
	const doColumnHelper = createColumnHelper<DoTask>();
	const doColumns = useMemo(
		() => [
			doColumnHelper.accessor('task', {
				header: () => t('home.taskDo'),
				cell: (info) => {
					const isDone = info.row.original.done;
					return (
						<span
							className={
								isDone
									? 'line-through text-muted-foreground/60 font-normal transition-all'
									: 'text-foreground font-medium transition-all'
							}
						>
							{info.getValue()}
						</span>
					);
				},
			}),
			doColumnHelper.accessor('done', {
				header: () => '',
				cell: (info) => {
					const isDone = info.getValue();
					return (
						<button
							onClick={() => onToggleDoTask(info.row.original.id)}
							className={
								isDone
									? themeConfig.matrixCheckboxActive
									: themeConfig.matrixCheckboxInactive
							}
						>
							{isDone && (
								<svg
									xmlns="http://www.w3.org/2000/svg"
									width="10"
									height="10"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="3.5"
									strokeLinecap="round"
									strokeLinejoin="round"
								>
									<polyline points="20 6 9 17 4 12" />
								</svg>
							)}
						</button>
					);
				},
			}),
		],
		[t, onToggleDoTask, themeConfig],
	);

	const doTable = useReactTable({
		data: matrix.do,
		columns: doColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	const scheduleColumnHelper = createColumnHelper<ScheduleTask>();
	const scheduleColumns = useMemo(
		() => [
			scheduleColumnHelper.accessor('task', {
				header: () => t('home.taskTodo'),
				cell: (info) => (
					<span className="text-foreground font-medium">{info.getValue()}</span>
				),
			}),
			scheduleColumnHelper.accessor('when', {
				header: () => t('home.when'),
				cell: (info) => (
					<span className="text-muted-foreground font-sans text-[10px] font-medium bg-muted/60 px-2 py-0.5 rounded-md border border-border/40">
						{info.getValue()}
					</span>
				),
			}),
		],
		[t],
	);

	const scheduleTable = useReactTable({
		data: matrix.schedule,
		columns: scheduleColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	const delegateColumnHelper = createColumnHelper<DelegateTask>();
	const delegateColumns = useMemo(
		() => [
			delegateColumnHelper.accessor('task', {
				header: () => t('home.taskDelegate'),
				cell: (info) => (
					<span className="text-foreground font-medium">{info.getValue()}</span>
				),
			}),
			delegateColumnHelper.accessor('who', {
				header: () => t('home.whoCanDoIt'),
				cell: (info) => (
					<span className="text-foreground font-sans text-[10px] bg-muted px-2 py-0.5 rounded-md border border-border font-medium">
						{info.getValue()}
					</span>
				),
			}),
		],
		[t],
	);

	const delegateTable = useReactTable({
		data: matrix.delegate,
		columns: delegateColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	const deleteColumnHelper = createColumnHelper<DeleteTask>();
	const deleteColumns = useMemo(
		() => [
			deleteColumnHelper.accessor('task', {
				header: () => t('home.taskDelete'),
				cell: (info) => (
					<span className="text-muted-foreground/60 line-through decoration-destructive/50 decoration-1">
						{info.getValue()}
					</span>
				),
			}),
		],
		[t],
	);

	const deleteTable = useReactTable({
		data: matrix.delete,
		columns: deleteColumns,
		getCoreRowModel: getCoreRowModel(),
	});

	// Reusable quadrant mini-table renderer
	const renderQuadrant = (
		table: ReturnType<
			typeof useReactTable<DoTask | ScheduleTask | DelegateTask | DeleteTask>
		>,
		title: string,
		indicator: React.ReactNode,
		itemCount: number,
	) => (
		<div className="flex-1 flex flex-col h-full min-h-0 overflow-hidden select-none">
			{/* Quadrant Sub-header */}
			<div className="flex items-center justify-between pb-1.5 mb-1 border-b border-border/50 flex-shrink-0">
				<div className="flex items-center gap-1.5">
					{indicator}
					<span className="text-[10px] font-sans font-bold tracking-wider uppercase text-foreground">
						{title}
					</span>
				</div>
				<span className="text-[10px] font-sans px-1.5 py-0.2 rounded bg-muted text-muted-foreground font-semibold border border-border/40">
					{itemCount}
				</span>
			</div>

			{/* Task Table */}
			<div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
				<table className="w-full text-left border-collapse text-xs">
					<thead>
						{table.getHeaderGroups().map((headerGroup) => (
							<tr key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<th key={header.id} className={themeConfig.matrixTableHeader}>
										{flexRender(
											header.column.columnDef.header,
											header.getContext(),
										)}
									</th>
								))}
							</tr>
						))}
					</thead>
					<tbody>
						{table.getRowModel().rows.map((row) => (
							<tr key={row.id} className={themeConfig.matrixRowHover}>
								{row.getVisibleCells().map((cell) => (
									<td
										key={cell.id}
										className="py-1.5 px-1 border-b border-border/30"
									>
										{flexRender(cell.column.columnDef.cell, cell.getContext())}
									</td>
								))}
							</tr>
						))}
					</tbody>
				</table>

				{/* Planner Dotted Lines: lấp đầy khoảng trống tự nhiên theo phong cách sổ tay Zen */}
				<div className="flex flex-col py-1 pointer-events-none opacity-40 dark:opacity-20">
					<div className="py-2.5 border-b border-dashed border-border" />
					<div className="py-2.5 border-b border-dashed border-border" />
					<div className="py-2.5 border-b border-dashed border-border" />
				</div>
			</div>
		</div>
	);

	return (
		<div className="flex-1 min-h-0 flex flex-col overflow-hidden">
			{/* Lưới 2x2 tối giản */}
			<div className={themeConfig.matrixContainer}>
				{/* Ô 1: DO (trái trên) */}
				<div className={`${themeConfig.matrixCell} matrix-cell-left`}>
					{renderQuadrant(
						doTable as never,
						t('home.taskDo') || 'Làm ngay (Do)',
						<span className="w-2 h-2 rounded-full bg-foreground shadow-xs shrink-0" />,
						matrix.do.length,
					)}
				</div>

				{/* Ô 2: SCHEDULE (phải trên) */}
				<div className={themeConfig.matrixCell}>
					{renderQuadrant(
						scheduleTable as never,
						t('home.taskTodo') || 'Lên lịch (Schedule)',
						<span className="w-2 h-2 rounded-full border-1.5 border-foreground bg-transparent shrink-0" />,
						matrix.schedule.length,
					)}
				</div>

				{/* Ô 3: DELEGATE (trái dưới) */}
				<div
					className={`${themeConfig.matrixCell} matrix-cell-left matrix-cell-divider`}
				>
					{renderQuadrant(
						delegateTable as never,
						t('home.taskDelegate') || 'Ủy quyền (Delegate)',
						<span className="w-2 h-2 rounded-xs bg-muted-foreground shrink-0" />,
						matrix.delegate.length,
					)}
				</div>

				{/* Ô 4: DELETE (phải dưới) */}
				<div className={`${themeConfig.matrixCell} matrix-cell-divider`}>
					{renderQuadrant(
						deleteTable as never,
						t('home.taskDelete') || 'Loại bỏ (Delete)',
						<span className="w-2 h-2 rounded-full border border-dashed border-foreground/70 shrink-0" />,
						matrix.delete.length,
					)}
				</div>
			</div>
		</div>
	);
}
