USE [Y0GI]
GO

/****** Object:  Table [dbo].[notifications]    Script Date: 23/01/2025 11:31:59 pm ******/
SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[notifications](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[type] [varchar](50) NOT NULL,
	[description] [text] NULL,
	[image_url] [varchar](255) NULL,
	[countdown_end] [datetime] NULL,
	[giveaway_end] [datetime] NULL,
	[guild_id] [varchar](50) NULL,
	[sent] [bit] NULL,
	[created_at] [datetime] NULL,
	[yt_url] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

ALTER TABLE [dbo].[notifications] ADD  DEFAULT ((0)) FOR [sent]
GO

ALTER TABLE [dbo].[notifications] ADD  DEFAULT (getdate()) FOR [created_at]
GO

